import os
import platform
import shutil
import subprocess
from pathlib import Path
import argparse
import sys

def clean_build():
    """Clean previous build artifacts"""
    dirs_to_clean = ['build', 'dist']
    for dir_name in dirs_to_clean:
        if os.path.exists(dir_name):
            shutil.rmtree(dir_name)
    if os.path.exists('scanner.spec'):
        os.remove('scanner.spec')

def build_macos_pkg(dist_dir):
    """Build a proper macOS .pkg installer

    Args:
        dist_dir (str): Path to the distribution directory
    """
    try:
        print("Creating macOS package installer (.pkg)...")

        # Create a temporary directory for package structure
        pkg_root = os.path.join(dist_dir, "pkg_root")
        os.makedirs(os.path.join(pkg_root, "usr/local/bin"), exist_ok=True)
        os.makedirs(os.path.join(pkg_root, "Applications"), exist_ok=True)

        # Copy the executable to usr/local/bin
        shutil.copy(
            os.path.join(dist_dir, "scanner"),
            os.path.join(pkg_root, "usr/local/bin/scanner")
        )

        # Make it executable
        os.chmod(os.path.join(pkg_root, "usr/local/bin/scanner"), 0o755)

        # Create a simple Info.plist for the package
        os.makedirs(os.path.join(dist_dir, "pkg_resources"), exist_ok=True)
        with open(os.path.join(dist_dir, "pkg_resources", "Info.plist"), "w") as f:
            f.write("""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>com.scanner.app</string>
    <key>CFBundleName</key>
    <string>Scanner</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2023</string>
</dict>
</plist>
""")

        # Create postinstall script to set permissions
        os.makedirs(os.path.join(dist_dir, "pkg_scripts"), exist_ok=True)
        with open(os.path.join(dist_dir, "pkg_scripts", "postinstall"), "w") as f:
            f.write("""#!/bin/bash
chmod 755 /usr/local/bin/scanner
exit 0
""")
        os.chmod(os.path.join(dist_dir, "pkg_scripts", "postinstall"), 0o755)

        # Use pkgbuild to create the package
        pkg_file = os.path.join(dist_dir, "scanner.pkg")
        cmd = [
            "pkgbuild",
            "--root", pkg_root,
            "--identifier", "com.scanner.app",
            "--version", "1.0.0",
            "--scripts", os.path.join(dist_dir, "pkg_scripts"),
            "--install-location", "/",
            pkg_file
        ]

        print(f"Running package build command: {' '.join(cmd)}")
        result = subprocess.run(cmd)

        if result.returncode == 0:
            print(f"Successfully created macOS package: {pkg_file}")
            return True
        else:
            print(f"Failed to create macOS package. Error code: {result.returncode}")
            return False

    except Exception as e:
        print(f"Error creating macOS package: {str(e)}")
        return False

def build_executable(target_platform=None):
    """Build the executable using PyInstaller

    Args:
        target_platform (str, optional): The platform to build for ('windows', 'linux', 'macos').
                                         Defaults to the current system.
    """
    # Determine target platform
    system = platform.system().lower()
    if target_platform is not None:
        if target_platform in ['win', 'windows']:
            system = 'windows'
        elif target_platform in ['mac', 'macos', 'darwin']:
            system = 'darwin'
        elif target_platform in ['linux', 'unix']:
            system = 'linux'
        else:
            print(f"Warning: Unknown platform '{target_platform}', using current system: {system}")

    print(f"Building for platform: {system}")

    # Determine path separator based on target platform
    separator = ';' if system == 'windows' else ':'

    # Base PyInstaller command with properly formatted arguments
    cmd = [
        'pyinstaller',
        '--name=scanner',
        '--onefile',
        '--noconsole',  # Hide console window
    ]

    # Add data files with correct syntax
    cmd.append(f'--add-data=README.md{separator}.')
    cmd.append(f'--add-data=app{separator}app')

    # Add script name
    cmd.append('main.py')

    # Add platform-specific options
    if system == 'windows':
        # Add icon only if it exists
        if os.path.exists('scanner.ico'):
            cmd.append('--icon=scanner.ico')
        cmd.append('--hidden-import=twain')
        cmd.append('--hidden-import=win32com.client')
    elif system == 'linux':
        # Add icon only if it exists
        if os.path.exists('scanner.ico'):
            cmd.append('--icon=scanner.ico')
        cmd.append('--hidden-import=sane')
    elif system == 'darwin':  # macOS
        # Skip the icon if it doesn't exist to avoid error
        if os.path.exists('scanner.icns'):
            cmd.append('--icon=scanner.icns')
        # macOS specific imports if needed
        cmd.append('--hidden-import=PIL')

    # Print the command for debugging
    print(f"Running command: {' '.join(cmd)}")

    # Run PyInstaller
    result = subprocess.run(cmd)

    if result.returncode != 0:
        print(f"Error: PyInstaller failed with return code {result.returncode}")
        sys.exit(result.returncode)

    # Create distribution directory if it doesn't exist
    dist_dir = Path('dist')
    dist_dir.mkdir(exist_ok=True)

    # Copy README to dist directory if it exists
    if os.path.exists('README.md'):
        readme_dest = os.path.join(dist_dir, 'README.md')
        shutil.copy('README.md', readme_dest)

    print(f"\nBuild completed! Executable is in the 'dist' directory.")
    print(f"Target platform: {system}")

    # Get the executable path without trying to copy it to itself
    exe_name = 'scanner.exe' if system == 'windows' else 'scanner'
    exe_path = os.path.abspath(os.path.join('dist', exe_name))
    print(f"Executable location: {exe_path}")
    print(f"To run the scanner service, execute: {exe_path}")
    print(f"The scanner service will run on port 8765")

    # Create a macOS .pkg installer if building for macOS
    if system == 'darwin':
        build_macos_pkg(str(dist_dir))

def main():
    """Parse command line arguments and build executable"""
    parser = argparse.ArgumentParser(description='Build scanner executable')
    parser.add_argument(
        '--platform', '-p',
        choices=['windows', 'win', 'linux', 'mac', 'macos', 'darwin'],
        help='Target platform (windows, linux, mac). Defaults to current system.')
    parser.add_argument(
        '--clean', '-c',
        action='store_true',
        help='Clean build artifacts before building')
    parser.add_argument(
        '--pkg-only',
        action='store_true',
        help='Skip PyInstaller and only build macOS package from existing dist directory')

    args = parser.parse_args()

    if args.pkg_only and platform.system().lower() == 'darwin':
        # Only build the macOS package from existing dist directory
        dist_dir = Path('dist')
        if dist_dir.exists():
            build_macos_pkg(str(dist_dir))
        else:
            print("Error: dist directory doesn't exist. Run a full build first.")
        return

    if args.clean:
        clean_build()

    build_executable(args.platform)

if __name__ == "__main__":
    main()
