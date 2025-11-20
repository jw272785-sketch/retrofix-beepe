#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;

#[tauri::command]
fn set_ignore_cursor_events(window: tauri::Window, ignore: bool) {
    #[cfg(any(target_os = "windows", target_os = "macos"))]
    window.set_ignore_cursor_events(ignore).unwrap_or_else(|e| eprintln!("Failed: {}", e));
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![set_ignore_cursor_events])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}