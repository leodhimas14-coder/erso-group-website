package al.ersogroup.karburanti;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Shows the fuel report page (assets/index.html) full screen; data stays in the app's storage. */
public class MainActivity extends Activity {
    private static final int PICK_FILE = 1;
    private WebView web;
    private ValueCallback<Uri[]> pending;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(0x16, 0x18, 0x1d));
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);
        web.addJavascriptInterface(new Bridge(), "KarburantiAndroid");
        web.setWebViewClient(new WebViewClient() {
            // Website links open in the browser; the app only ever shows its own page.
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("file".equals(u.getScheme())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            // <input type="file">: the photo of a report and the backup to restore.
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pending != null) pending.onReceiveValue(null);
                pending = callback;
                try {
                    startActivityForResult(params.createIntent(), PICK_FILE);
                } catch (Exception e) {
                    pending = null;
                    return false;
                }
                return true;
            }
        });
        setContentView(web);
        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request != PICK_FILE || pending == null) return;
        pending.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
        pending = null;
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.__karburantiDirty && window.__karburantiDirty()", dirty -> {
            boolean unsaved = "true".equals(dirty);
            new AlertDialog.Builder(this)
                .setTitle(unsaved ? "Raporti nuk është ruajtur" : "Të mbyllet Karburanti?")
                .setMessage(unsaved ? "Nëse e mbyllni tani, ndryshimet humbasin. Shtypni \"Anulo\" dhe pastaj \"Ruaj raportin\"." : null)
                .setPositiveButton(unsaved ? "Mbyll pa ruajtur" : "Mbyll", (d, w) -> finish())
                .setNegativeButton("Anulo", null)
                .show();
        });
    }

    /** Called from the page as window.KarburantiAndroid. */
    private class Bridge {
        @JavascriptInterface
        public String saveFile(String name, String text, String mime) {
            try {
                ContentResolver r = getContentResolver();
                ContentValues v = new ContentValues();
                v.put(MediaStore.Downloads.DISPLAY_NAME, name);
                v.put(MediaStore.Downloads.MIME_TYPE, mime == null || mime.isEmpty() ? "text/plain" : mime);
                v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Karburanti");
                Uri uri = r.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri == null) return "nuk u krijua";
                try (OutputStream os = r.openOutputStream(uri)) {
                    os.write(text.getBytes(StandardCharsets.UTF_8));
                }
                return "ok";
            } catch (Exception e) {
                return String.valueOf(e.getMessage());
            }
        }

        @JavascriptInterface
        public void print(String title) {
            runOnUiThread(() -> {
                PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                PrintDocumentAdapter adapter = web.createPrintDocumentAdapter(title);
                pm.print(title, adapter, new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
            });
        }
    }
}
