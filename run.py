#!/usr/bin/env python3
"""
Simple local development server runner for the Restaurant Management System.
Allows running with: python run.py
Or students can simply double-click 'index.html' to open directly in any browser!
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable cache for smooth development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def main():
    # Change working directory to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    print("=" * 65)
    print("🍔 Savory Bites - Restaurant Management System (In-Memory)")
    print("   School Software Development Project")
    print("=" * 65)
    print(f"[*] Starting local server at: http://localhost:{PORT}")
    print("[*] Note: You can also just double-click 'index.html' directly!")
    print("[*] Press Ctrl+C to stop the server.")
    print("=" * 65)

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            webbrowser.open(f"http://localhost:{PORT}/index.html")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Server stopped.")
        sys.exit(0)
    except OSError as e:
        print(f"[!] Port {PORT} might be busy. You can directly open 'index.html' in your browser.")
        webbrowser.open(f"file://{os.path.abspath('index.html')}")

if __name__ == '__main__':
    main()

