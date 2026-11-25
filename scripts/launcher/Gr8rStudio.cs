using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace Gr8rStudioLauncher
{
  internal static class Program
  {
    private const string AppName = "Gr8r Studio";
    private const string AppUrl = "http://127.0.0.1:8090";
    private const string HealthUrl = "http://127.0.0.1:8090/api/health";
    private const string MutexName = "Local\\Gr8rStudioLauncher";
    private const string RunKeyPath = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
    private const string RunValueName = "Gr8rStudio";

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool DestroyIcon(IntPtr hIcon);

    [STAThread]
    private static void Main(string[] args)
    {
      bool silent = false;
      for (int i = 0; i < args.Length; i++)
      {
        string a = (args[i] ?? string.Empty).Trim().ToLowerInvariant();
        if (a == "--autostart" || a == "--silent" || a == "-s")
        {
          silent = true;
        }
      }

      bool createdNew;
      using (Mutex mutex = new Mutex(true, MutexName, out createdNew))
      {
        if (!createdNew)
        {
          if (!silent)
          {
            OpenBrowser();
          }
          return;
        }

        string root = FindProjectRoot();
        if (root == null)
        {
          MessageBox.Show(
            "No se encontró pocketbase\\pocketbase.exe en la carpeta de Gr8r Studio.",
            AppName,
            MessageBoxButtons.OK,
            MessageBoxIcon.Error
          );
          return;
        }

        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new TrayContext(root, silent));
      }
    }

    internal static string FindProjectRoot()
    {
      DirectoryInfo dir = new DirectoryInfo(AppDomain.CurrentDomain.BaseDirectory);
      while (dir != null)
      {
        string candidate = Path.Combine(dir.FullName, "pocketbase", "pocketbase.exe");
        if (File.Exists(candidate))
        {
          return dir.FullName;
        }
        dir = dir.Parent;
      }
      return null;
    }

    internal static void OpenBrowser()
    {
      try
      {
        ProcessStartInfo psi = new ProcessStartInfo(AppUrl);
        psi.UseShellExecute = true;
        Process.Start(psi);
      }
      catch (Exception ex)
      {
        MessageBox.Show(
          "No se pudo abrir el navegador en " + AppUrl + "\n\n" + ex.Message,
          AppName,
          MessageBoxButtons.OK,
          MessageBoxIcon.Warning
        );
      }
    }

    internal static bool IsHealthOk(int timeoutMs)
    {
      try
      {
        HttpWebRequest req = (HttpWebRequest)WebRequest.Create(HealthUrl);
        req.Method = "GET";
        req.Timeout = timeoutMs;
        req.ReadWriteTimeout = timeoutMs;
        using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
        {
          return res.StatusCode == HttpStatusCode.OK;
        }
      }
      catch
      {
        return false;
      }
    }

    internal static bool IsAutostartEnabled()
    {
      try
      {
        using (RegistryKey key = Registry.CurrentUser.OpenSubKey(RunKeyPath, false))
        {
          if (key == null) return false;
          object val = key.GetValue(RunValueName);
          return val != null && !string.IsNullOrEmpty(val.ToString());
        }
      }
      catch
      {
        return false;
      }
    }

    internal static void SetAutostart(bool enable)
    {
      using (RegistryKey key = Registry.CurrentUser.OpenSubKey(RunKeyPath, true))
      {
        if (key == null) return;
        if (enable)
        {
          string exePath = Application.ExecutablePath;
          key.SetValue(RunValueName, "\"" + exePath + "\" --autostart", RegistryValueKind.String);
        }
        else
        {
          key.DeleteValue(RunValueName, false);
        }
      }
    }

    internal static Icon CreateTrayIcon()
    {
      using (Bitmap bmp = new Bitmap(32, 32))
      using (Graphics g = Graphics.FromImage(bmp))
      {
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.Clear(Color.Transparent);

        using (GraphicsPath path = RoundedRect(new Rectangle(1, 1, 30, 30), 7))
        using (SolidBrush bg = new SolidBrush(Color.FromArgb(29, 28, 26)))
        using (Pen border = new Pen(Color.FromArgb(90, 103, 216), 1.6f))
        {
          g.FillPath(bg, path);
          g.DrawPath(border, path);
        }

        using (Font font = new Font("Segoe UI", 11.5f, FontStyle.Bold, GraphicsUnit.Point))
        using (SolidBrush fg = new SolidBrush(Color.White))
        using (StringFormat sf = new StringFormat())
        {
          sf.Alignment = StringAlignment.Center;
          sf.LineAlignment = StringAlignment.Center;
          g.DrawString("G8", font, fg, new RectangleF(0, 1, 32, 31), sf);
        }

        IntPtr hIcon = bmp.GetHicon();
        try
        {
          using (Icon tmp = Icon.FromHandle(hIcon))
          {
            return (Icon)tmp.Clone();
          }
        }
        finally
        {
          DestroyIcon(hIcon);
        }
      }
    }

    private static GraphicsPath RoundedRect(Rectangle bounds, int radius)
    {
      int d = radius * 2;
      GraphicsPath path = new GraphicsPath();
      path.AddArc(bounds.X, bounds.Y, d, d, 180, 90);
      path.AddArc(bounds.Right - d, bounds.Y, d, d, 270, 90);
      path.AddArc(bounds.Right - d, bounds.Bottom - d, d, d, 0, 90);
      path.AddArc(bounds.X, bounds.Bottom - d, d, d, 90, 90);
      path.CloseFigure();
      return path;
    }
  }

  internal sealed class TrayContext : ApplicationContext
  {
    private readonly string _root;
    private readonly NotifyIcon _tray;
    private readonly ToolStripMenuItem _statusItem;
    private readonly ToolStripMenuItem _autostartItem;
    private readonly Icon _icon;
    private Process _pbProc;
    private bool _pbOwned;
    private bool _exiting;

    public TrayContext(string root, bool silent)
    {
      _root = root;
      _icon = Program.CreateTrayIcon();

      ToolStripMenuItem openItem = new ToolStripMenuItem("Abrir Gr8r Studio");
      openItem.Font = new Font(openItem.Font, FontStyle.Bold);
      openItem.Click += delegate { Program.OpenBrowser(); };

      _statusItem = new ToolStripMenuItem("Estado: comprobando...");
      _statusItem.Enabled = false;

      ToolStripMenuItem restartItem = new ToolStripMenuItem("Reiniciar PocketBase");
      restartItem.Click += delegate { RestartPocketBase(); };

      _autostartItem = new ToolStripMenuItem("Autoinicio con Windows");
      _autostartItem.Click += delegate { ToggleAutostart(); };

      ToolStripMenuItem exitItem = new ToolStripMenuItem("Salir");
      exitItem.Click += delegate { ExitApp(); };

      ContextMenuStrip menu = new ContextMenuStrip();
      menu.Items.Add(openItem);
      menu.Items.Add(_statusItem);
      menu.Items.Add(new ToolStripSeparator());
      menu.Items.Add(restartItem);
      menu.Items.Add(_autostartItem);
      menu.Items.Add(new ToolStripSeparator());
      menu.Items.Add(exitItem);
      menu.Opening += delegate { RefreshMenuState(); };

      _tray = new NotifyIcon();
      _tray.Icon = _icon;
      _tray.Text = "Gr8r Studio (127.0.0.1:8090)";
      _tray.ContextMenuStrip = menu;
      _tray.Visible = true;
      _tray.DoubleClick += delegate { Program.OpenBrowser(); };

      SystemEvents.SessionEnding += OnSessionEnding;
      StartPocketBaseAsync(!silent);
    }

    private void RefreshMenuState()
    {
      bool alive = IsManagedRunning() || Program.IsHealthOk(600);
      _statusItem.Text = alive
        ? (_pbOwned ? "Estado: activo (127.0.0.1:8090)" : "Estado: PocketBase externo activo")
        : "Estado: detenido";
      _autostartItem.Checked = Program.IsAutostartEnabled();
    }

    private bool IsManagedRunning()
    {
      try
      {
        return _pbProc != null && !_pbProc.HasExited;
      }
      catch
      {
        return false;
      }
    }

    private void StartPocketBaseAsync(bool openWhenReady)
    {
      ThreadPool.QueueUserWorkItem(delegate
      {
        if (Program.IsHealthOk(800))
        {
          _pbOwned = false;
          if (openWhenReady) Program.OpenBrowser();
          return;
        }

        string exe = Path.Combine(_root, "pocketbase", "pocketbase.exe");
        string pubHtml = Path.Combine(_root, "pocketbase", "pb_public", "index.html");
        if (!File.Exists(pubHtml))
        {
          _tray.ShowBalloonTip(
            4000,
            "Gr8r Studio",
            "Falta pocketbase\\pb_public. Ejecuta 'npm run build:pb' para generar la web.",
            ToolTipIcon.Warning
          );
        }

        try
        {
          ProcessStartInfo psi = new ProcessStartInfo();
          psi.FileName = exe;
          psi.Arguments = "serve --http=127.0.0.1:8090";
          psi.WorkingDirectory = _root;
          psi.UseShellExecute = false;
          psi.CreateNoWindow = true;
          psi.WindowStyle = ProcessWindowStyle.Hidden;

          _pbProc = Process.Start(psi);
          _pbOwned = _pbProc != null;

          for (int i = 0; i < 40; i++)
          {
            if (_exiting) return;
            if (Program.IsHealthOk(500)) break;
            Thread.Sleep(150);
          }

          if (openWhenReady && !_exiting)
          {
            Program.OpenBrowser();
          }
        }
        catch (Exception ex)
        {
          if (!_exiting)
          {
            _tray.ShowBalloonTip(4000, "Gr8r Studio", "Error al iniciar PocketBase: " + ex.Message, ToolTipIcon.Error);
          }
        }
      });
    }

    private void RestartPocketBase()
    {
      StopOwnedPocketBase();
      StartPocketBaseAsync(false);
    }

    private void ToggleAutostart()
    {
      try
      {
        bool next = !Program.IsAutostartEnabled();
        Program.SetAutostart(next);
        _autostartItem.Checked = next;
      }
      catch (Exception ex)
      {
        MessageBox.Show(
          "No se pudo cambiar el autoinicio:\n\n" + ex.Message,
          "Gr8r Studio",
          MessageBoxButtons.OK,
          MessageBoxIcon.Error
        );
      }
    }

    private void StopOwnedPocketBase()
    {
      if (!_pbOwned || _pbProc == null) return;
      try
      {
        if (!_pbProc.HasExited)
        {
          _pbProc.Kill();
          _pbProc.WaitForExit(3000);
        }
      }
      catch
      {
        /* ignore if already exited */
      }
      finally
      {
        try { _pbProc.Dispose(); } catch { }
        _pbProc = null;
        _pbOwned = false;
      }
    }

    private void OnSessionEnding(object sender, SessionEndingEventArgs e)
    {
      StopOwnedPocketBase();
    }

    private void ExitApp()
    {
      if (_exiting) return;
      _exiting = true;
      SystemEvents.SessionEnding -= OnSessionEnding;
      StopOwnedPocketBase();
      _tray.Visible = false;
      _tray.Dispose();
      _icon.Dispose();
      ExitThread();
    }
  }
}
