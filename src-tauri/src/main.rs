#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{Manager, SystemTray, SystemTrayMenu, CustomMenuItem, SystemTrayEvent, SystemTrayMenuItem, Window};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use serde::{Deserialize, Serialize};

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{
    SetWindowPos, SWP_NOACTIVATE, HWND_BOTTOM, GetSystemMetrics, SM_CXSCREEN, SM_CYSCREEN,
    GetCursorPos,
};
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{HWND, POINT};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct HitBox {
    x: i32,
    y: i32,
    width: i32,
    height: i32,
}

#[tauri::command]
fn set_ignore_cursor_events(window: tauri::Window, ignore: bool) {
    #[cfg(any(target_os = "windows", target_os = "macos"))]
    window.set_ignore_cursor_events(ignore).unwrap_or_else(|e| eprintln!("Failed: {}", e));
}

#[tauri::command]
fn update_hit_boxes(hit_boxes: Vec<HitBox>, state: tauri::State<HitBoxState>) {
    let mut boxes = state.0.lock().unwrap();
    *boxes = hit_boxes;
    println!("Updated hit boxes: {} boxes", boxes.len());
}

struct HitBoxState(Arc<Mutex<Vec<HitBox>>>);

#[cfg(target_os = "windows")]
fn start_mouse_monitor(window: Window, hit_boxes: Arc<Mutex<Vec<HitBox>>>) {
    thread::spawn(move || {
        let mut last_state = true; // Start with passthrough enabled
        
        loop {
            thread::sleep(Duration::from_millis(50));
            
            unsafe {
                let mut point = POINT { x: 0, y: 0 };
                if GetCursorPos(&mut point).as_bool() {
                    let boxes = hit_boxes.lock().unwrap();
                    let mut is_over_widget = false;
                    
                    for hit_box in boxes.iter() {
                        if point.x >= hit_box.x 
                            && point.x <= hit_box.x + hit_box.width
                            && point.y >= hit_box.y
                            && point.y <= hit_box.y + hit_box.height
                        {
                            is_over_widget = true;
                            break;
                        }
                    }
                    
                    // Only update if state changed
                    if is_over_widget != last_state {
                        last_state = is_over_widget;
                        let _ = window.set_ignore_cursor_events(!is_over_widget);
                        println!("Mouse over widget: {}, passthrough: {}", is_over_widget, !is_over_widget);
                    }
                }
            }
        }
    });
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let clear_all = CustomMenuItem::new("clear_all".to_string(), "Clear All Cards");
    let tray_menu = SystemTrayMenu::new()
        .add_item(clear_all)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    let system_tray = SystemTray::new().with_menu(tray_menu);

    let hit_boxes = Arc::new(Mutex::new(Vec::new()));
    let hit_boxes_clone = hit_boxes.clone();

    tauri::Builder::default()
        .manage(HitBoxState(hit_boxes))
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "clear_all" => {
                        if let Some(window) = app.get_window("main") {
                            let _ = window.eval("localStorage.removeItem('retrofix-cards'); window.location.reload();");
                        }
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .setup(move |app| {
            let window = app.get_window("main").unwrap();
            
            #[cfg(target_os = "windows")]
            {
                unsafe {
                    let screen_width = GetSystemMetrics(SM_CXSCREEN);
                    let screen_height = GetSystemMetrics(SM_CYSCREEN);
                    
                    let _ = window.set_size(tauri::PhysicalSize {
                        width: screen_width as u32,
                        height: (screen_height - 40) as u32,
                    });
                    
                    let _ = window.set_position(tauri::PhysicalPosition { x: 0, y: 0 });
                    
                    let hwnd = HWND(window.hwnd().unwrap().0 as isize);
                    SetWindowPos(
                        hwnd,
                        HWND_BOTTOM,
                        0,
                        0,
                        0,
                        0,
                        SWP_NOACTIVATE | windows::Win32::UI::WindowsAndMessaging::SWP_NOMOVE | windows::Win32::UI::WindowsAndMessaging::SWP_NOSIZE,
                    );
                    
                    println!("Window set to bottom z-order, size: {}x{}", screen_width, screen_height - 40);
                }

                // Start mouse monitoring thread
                start_mouse_monitor(window.clone(), hit_boxes_clone);
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_ignore_cursor_events, update_hit_boxes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}