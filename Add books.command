#!/bin/bash
# Double-click this file to put the books you dropped in the books folder on the Library's shelf "Your books and PDFs".
cd "$(dirname "$0")/lamplighter" 2>/dev/null || { echo "The source folder (lamplighter) is not beside this file."; read -p "Press Return to close."; exit 1; }
if ! command -v node >/dev/null 2>&1; then
  echo "This needs Node.js (nodejs.org). Without it, add books inside the app: Setup, Freedom, Your own texts."
  read -p "Press Return to close."; exit 1
fi
node tools/add_books.js
echo
read -p "Done. Open Lamplighter.html (or reload it). Press Return to close."
