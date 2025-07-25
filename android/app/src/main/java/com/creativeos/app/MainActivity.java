package com.creativeos.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Handle the intent when app is first opened
        handleIntent(getIntent());
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        
        // Handle the intent when app is already running
        handleIntent(intent);
    }
    
    private void handleIntent(Intent intent) {
        String action = intent.getAction();
        String type = intent.getType();
        
        if (Intent.ACTION_SEND.equals(action) && type != null) {
            if ("text/plain".equals(type)) {
                handleSendText(intent);
            }
        } else if (Intent.ACTION_VIEW.equals(action)) {
            handleViewAction(intent);
        }
    }
    
    private void handleSendText(Intent intent) {
        String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (sharedText != null) {
            // Send to JavaScript
            JSObject data = new JSObject();
            
            // Extract URL from text if present
            String url = extractUrl(sharedText);
            if (url != null) {
                data.put("url", url);
                data.put("comment", sharedText);
            } else {
                data.put("text", sharedText);
            }
            
            // Notify the web app
            bridge.triggerWindowJSEvent("appUrlOpen", data.toString());
        }
    }
    
    private void handleViewAction(Intent intent) {
        String url = intent.getDataString();
        if (url != null) {
            JSObject data = new JSObject();
            
            // Parse creativeos:// URLs
            if (url.startsWith("creativeos://")) {
                // Extract parameters from deep link
                data.put("url", url);
            } else {
                // Regular HTTP/HTTPS URL
                data.put("url", url);
            }
            
            // Notify the web app
            bridge.triggerWindowJSEvent("appUrlOpen", data.toString());
        }
    }
    
    private String extractUrl(String text) {
        if (text == null) return null;
        
        // Simple URL extraction - looks for http:// or https://
        String[] words = text.split("\\s+");
        for (String word : words) {
            if (word.startsWith("http://") || word.startsWith("https://")) {
                return word;
            }
        }
        
        return null;
    }
}
