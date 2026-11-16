package com.navis.tv;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

/** Server address and player password, entered once with the remote. */
public class SetupActivity extends Activity {

    /** Render resolution presets, as a fraction of the screen resolution. */
    private static final float[] RENDER_SCALES = {1f, 0.85f, 0.75f, 0.6f, 0.5f};

    private EditText serverUrlInput;
    private EditText passwordInput;
    private CheckBox startOnBootInput;
    private CheckBox lowPerformanceInput;
    private Spinner renderScaleInput;
    private TextView previewText;
    private Prefs prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_setup);

        prefs = new Prefs(this);
        serverUrlInput = findViewById(R.id.server_url_input);
        passwordInput = findViewById(R.id.password_input);
        startOnBootInput = findViewById(R.id.start_on_boot_input);
        lowPerformanceInput = findViewById(R.id.low_performance_input);
        renderScaleInput = findViewById(R.id.render_scale_input);
        previewText = findViewById(R.id.url_preview);

        serverUrlInput.setText(prefs.getServerUrl());
        passwordInput.setText(prefs.getPassword());
        startOnBootInput.setChecked(prefs.getStartOnBoot());
        lowPerformanceInput.setChecked(prefs.getLowPerformanceMode());

        String[] scaleLabels = new String[RENDER_SCALES.length];
        for (int i = 0; i < RENDER_SCALES.length; i++) {
            scaleLabels[i] = getString(
                    R.string.setup_scale_option, Math.round(RENDER_SCALES[i] * 100));
        }
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this, android.R.layout.simple_spinner_dropdown_item, scaleLabels);
        renderScaleInput.setAdapter(adapter);
        renderScaleInput.setSelection(indexOfScale(prefs.getRenderScale()));

        updatePreview();

        serverUrlInput.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View view, boolean hasFocus) {
                if (!hasFocus) {
                    updatePreview();
                }
            }
        });

        Button saveButton = findViewById(R.id.save_button);
        saveButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                save();
            }
        });

        Button cancelButton = findViewById(R.id.cancel_button);
        cancelButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                finish();
            }
        });

        serverUrlInput.requestFocus();
    }

    private void updatePreview() {
        String normalized = Prefs.normalizeServerUrl(serverUrlInput.getText().toString());
        previewText.setText(
                normalized.isEmpty()
                        ? getString(R.string.setup_preview_empty)
                        : normalized + "/?map_only");
    }

    private void save() {
        String serverUrl = Prefs.normalizeServerUrl(serverUrlInput.getText().toString());
        if (serverUrl.isEmpty()) {
            Toast.makeText(this, R.string.setup_server_required, Toast.LENGTH_LONG).show();
            serverUrlInput.requestFocus();
            return;
        }
        prefs.save(
                serverUrl,
                passwordInput.getText().toString(),
                startOnBootInput.isChecked(),
                lowPerformanceInput.isChecked(),
                selectedScale());
        finish();
    }

    private float selectedScale() {
        int position = renderScaleInput.getSelectedItemPosition();
        return position >= 0 && position < RENDER_SCALES.length
                ? RENDER_SCALES[position]
                : Prefs.DEFAULT_RENDER_SCALE;
    }

    private static int indexOfScale(float scale) {
        for (int i = 0; i < RENDER_SCALES.length; i++) {
            if (Math.abs(RENDER_SCALES[i] - scale) < 0.01f) return i;
        }
        return 0;
    }
}
