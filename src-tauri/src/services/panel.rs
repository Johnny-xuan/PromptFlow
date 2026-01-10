use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, ManagerExt, PanelLevel, StyleMask, TrackingAreaOptions,
    WebviewWindowExt,
};

tauri_panel! {
    panel!(PromptFlowPanel {
        config: {
            can_become_key_window: true,
            is_floating_panel: true
        }
        with: {
            tracking_area: {
                options: TrackingAreaOptions::new()
                    .active_always()
                    .mouse_entered_and_exited()
                    .mouse_moved(),
                auto_resize: true
            }
        }
    })

    panel_event!(PromptFlowPanelEventHandler {
        window_did_become_key(notification: &NSNotification) -> (),
        window_did_resign_key(notification: &NSNotification) -> ()
    })
}

/// 初始化主窗口为 NSPanel
pub fn init_panel(app_handle: &AppHandle) {
    let window: WebviewWindow = match app_handle.get_webview_window("main") {
        Some(w) => w,
        None => {
            eprintln!("[PromptFlow] Failed to get main window for panel conversion");
            return;
        }
    };

    let panel = match window.to_panel::<PromptFlowPanel>() {
        Ok(p) => p,
        Err(e) => {
            eprintln!("[PromptFlow] Failed to convert window to panel: {:?}", e);
            return;
        }
    };

    let handler = PromptFlowPanelEventHandler::new();

    let handle = app_handle.clone();
    handler.window_did_become_key(move |_notification| {
        let app_name = handle.package_info().name.to_owned();
        eprintln!("[PromptFlow] {:?} panel becomes key window!", app_name);
    });

    handler.window_did_resign_key(|_notification| {
        eprintln!("[PromptFlow] panel resigned from key window!");
    });

    // 设置浮动层级
    panel.set_level(PanelLevel::Floating.value());

    // 关键：设置为非激活面板，支持全屏召唤
    // 注意：在 NSPanel/tao 组合下，某些 style mask 组合会导致 did_finish_launching 阶段 panic。
    panel.set_style_mask(
        StyleMask::empty()
            .nonactivating_panel()
            .resizable()
            .into(),
    );

    // 关键：允许 panel 显示在全屏窗口上方 + 加入所有空间
    panel.set_collection_behavior(
        CollectionBehavior::new()
            .full_screen_auxiliary()
            .can_join_all_spaces()
            .into(),
    );

    panel.set_event_handler(Some(handler.as_ref()));

    eprintln!("[PromptFlow] Panel initialized successfully with fullscreen support");
}

/// 显示 panel
#[allow(dead_code)]
pub fn show_panel(app_handle: &AppHandle) {
    if let Ok(panel) = app_handle.get_webview_panel("main") {
        panel.show();
    }
}

/// 隐藏 panel
#[allow(dead_code)]
pub fn hide_panel(app_handle: &AppHandle) {
    if let Ok(panel) = app_handle.get_webview_panel("main") {
        panel.hide();
    }
}

/// 切换 panel 显示/隐藏状态
#[allow(dead_code)]
pub fn toggle_panel(app_handle: &AppHandle) {
    if let Ok(panel) = app_handle.get_webview_panel("main") {
        if panel.is_visible() {
            panel.hide();
        } else {
            panel.show();
        }
    }
}
