charts, tabel data, sidebar navigation, dan dark mode. Gunakan React dan Recharts.',
        api: 'Buatkan REST API dengan fitur: autentikasi JWT, CRUD operations, dan dokumentasi Swagger. Gunakan Node.js dan Express.'
    };
    input.value = templates[type] || '';
}

function buildProject() {
    const input = document.getElementById('projectBuilderInput').value;
    if (!input) {
        showToast('Please describe your project', 'error');
        return;
    }

    closeModal('projectBuilder');
    showToast('AI is building your project...', 'info');

    setTimeout(() => {
        addTerminalLine('🤖 AI Project Builder started...', 'info');
        addTerminalLine('  ⠋ Analyzing requirements...', 'normal');
    }, 500);

    setTimeout(() => {
        addTerminalLine('  ⠙ Generating folder structure...', 'normal');
    }, 1500);

    setTimeout(() => {
        addTerminalLine('  ⠹ Creating component files...', 'normal');
    }, 2500);

    setTimeout(() => {
        addTerminalLine('  ⠸ Writing code...', 'normal');
    }, 3500);

    setTimeout(() => {
        addTerminalLine('  ⠼ Installing dependencies...', 'normal');
    }, 4500);

    setTimeout(() => {
        addTerminalLine('  ✓ Project built successfully!', 'success');
        addTerminalLine('  ✓ Files: 24 created', 'success');
        addTerminalLine('  ✓ Dependencies: 12 installed', 'success');
        addTerminalLine('  ✓ Ready to run: npm run dev', 'success');
        showToast('Project built successfully! Run "npm run dev" to start.', 'success');
        addGeneratedFiles();
    }, 5500);
}

function addGeneratedFiles() {
    state.fileContents['src/components/ProductCard.tsx'] = `import React from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-cyan-500 transition">
      <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-semibold text-white">{product.name}</h3>
        <p className="text-cyan-400 font-bold mt-1">${product.price}</p>
        <button className="w-full mt-3 bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded font-medium transition">
          Add to Cart
        </button>
      </div>
    </div>
  );
}`;

    state.fileContents['src/hooks/useCart.ts'] = `import { useState, useCallback } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { items, addItem, removeItem, total };
}`;

    renderFileTree();
}

// ============================================
// SETTINGS
// ============================================

function toggleSetting(toggle) {
    toggle.classList.toggle('active');
}

function changeFontSize(size) {
    state.settings.fontSize = parseInt(size);
    if (editor && monacoReady) {
        editor.updateOptions({ fontSize: state.settings.fontSize });
    }
    showToast(`Font size changed to ${size}px`, 'info');
}

// ============================================
// SEARCH
// ============================================

function performSearch(event) {
    if (event && event.key !== 'Enter') return;

    const query = document.getElementById('searchInput').value;
    const resultsContainer = document.getElementById('searchResults');

    if (!query) {
        resultsContainer.innerHTML = '';
        return;
    }

    resultsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';

    setTimeout(() => {
        const results = [];
        Object.entries(state.fileContents).forEach(([filename, content]) => {
            if (content.toLowerCase().includes(query.toLowerCase())) {
                const lines = content.split('\n');
                lines.forEach((line, idx) => {
                    if (line.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            file: filename,
                            line: idx + 1,
                            text: line.trim()
                        });
                    }
                });
            }
        });

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><div class="empty-state-title">No results found</div></div>';
            return;
        }

        resultsContainer.innerHTML = `<div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px;">${results.length} results in ${new Set(results.map(r => r.file)).size} files</div>`;

        results.slice(0, 20).forEach(result => {
            const item = document.createElement('div');
            item.className = 'git-change-item';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 12px; color: var(--text-primary); font-weight: 500;">${result.file}</div>
                    <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">Line ${result.line}: ${escapeHtml(result.text.substring(0, 60))}</div>
                </div>
            `;
            item.onclick = () => {
                const node = findFileNode(result.file);
                if (node) {
                    openFile(result.file, node.lang || getLangFromExt(result.file));
                }
            };
            resultsContainer.appendChild(item);
        });
    }, 300);
}

function performReplace() {
    const search = document.getElementById('searchInput').value;
    const replace = document.getElementById('replaceInput').value;

    if (!search) {
        showToast('Enter search term first', 'error');
        return;
    }

    let count = 0;
    Object.keys(state.fileContents).forEach(filename => {
        const content = state.fileContents[filename];
        const newContent = content.split(search).join(replace);
        if (newContent !== content) {
            state.fileContents[filename] = newContent;
            count++;
        }
    });

    showToast(`Replaced in ${count} files`, 'success');
    if (state.activeFile && editor) {
        editor.setValue(state.fileContents[state.activeFile]);
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('replaceInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

// ============================================
// FILE OPERATIONS
// ============================================

function newFile() {
    showModal('newFile');
    setTimeout(() => document.getElementById('newFileName').focus(), 100);
}

function confirmNewFile() {
    const name = document.getElementById('newFileName').value;
    if (!name) return;

    state.fileContents[name] = '';
    closeModal('newFile');
    document.getElementById('newFileName').value = '';

    fileSystem.children.push({ name, type: 'file', lang: getLangFromExt(name) });
    renderFileTree();
    openFile(name, getLangFromExt(name));
    showToast(`Created ${name}`, 'success');
}

function newFolder() {
    showModal('newFolder');
    setTimeout(() => document.getElementById('newFolderName').focus(), 100);
}

function confirmNewFolder() {
    const name = document.getElementById('newFolderName').value;
    if (!name) return;

    closeModal('newFolder');
    document.getElementById('newFolderName').value = '';

    fileSystem.children.push({ name, type: 'folder', expanded: false, children: [] });
    renderFileTree();
    showToast(`Created folder: ${name}`, 'success');
}

function refreshExplorer() {
    renderFileTree();
    showToast('Explorer refreshed', 'info');
}

function collapseAll() {
    function collapse(node) {
        if (node.type === 'folder') {
            node.expanded = false;
            if (node.children) node.children.forEach(collapse);
        }
    }
    collapse(fileSystem);
    renderFileTree();
}

// ============================================
// CONTEXT MENU
// ============================================

function showContextMenu(x, y) {
    const menu = document.getElementById('contextMenu');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'block';
}

function contextAction(action) {
    const target = state.contextMenuTarget;
    if (!target) return;

    document.getElementById('contextMenu').style.display = 'none';

    switch(action) {
        case 'open':
            if (target.type === 'file') {
                openFile(target.name, target.lang || getLangFromExt(target.name));
            }
            break;
        case 'rename':
            const newName = prompt('New name:', target.name);
            if (newName && newName !== target.name) {
                target.name = newName;
                renderFileTree();
                showToast(`Renamed to ${newName}`, 'success');
            }
            break;
        case 'duplicate':
            const dupName = target.name.replace(/(\.[^.]+)$/, ' copy$1');
            fileSystem.children.push({
                name: dupName,
                type: target.type,
                lang: target.lang,
                children: target.children ? [...target.children] : undefined
            });
            state.fileContents[dupName] = state.fileContents[target.name] || '';
            renderFileTree();
            showToast(`Duplicated as ${dupName}`, 'success');
            break;
        case 'copyPath':
            navigator.clipboard.writeText(`src/${target.name}`);
            showToast('Path copied to clipboard', 'success');
            break;
        case 'delete':
            if (confirm(`Delete ${target.name}?`)) {
                const parent = findParentNode(target.name);
                if (parent && parent.children) {
                    parent.children = parent.children.filter(c => c.name !== target.name);
                }
                delete state.fileContents[target.name];
                state.openFiles = state.openFiles.filter(f => f !== target.name);
                if (state.activeFile === target.name) {
                    state.activeFile = null;
                    document.getElementById('editorPlaceholder').style.display = 'flex';
                    document.getElementById('monaco-editor').style.display = 'none';
                }
                renderFileTree();
                renderTabs();
                showToast(`Deleted ${target.name}`, 'success');
            }
            break;
    }
}

// ============================================
// MODALS
// ============================================

function showModal(name) {
    document.getElementById('modal-' + name).classList.add('active');
}

function closeModal(name) {
    document.getElementById('modal-' + name).classList.remove('active');
}

// ============================================
// TOASTS
// ============================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// UTILITIES
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        document.getElementById('globalSearch').focus();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        newFile();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        toggleBottomPanel();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        showToast('Command Palette (coming soon)', 'info');
    }

    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        document.getElementById('contextMenu').style.display = 'none';
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu')) {
        document.getElementById('contextMenu').style.display = 'none';
    }
});

document.getElementById('terminalBody').addEventListener('click', (e) => {
    if (e.target === document.getElementById('terminalBody') || e.target.id === 'terminalContent') {
        document.getElementById('terminalInput').focus();
    }
});

document.getElementById('globalSearch').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value;
        if (query) {
            showPanel('search');
            document.getElementById('searchInput').value = query;
            performSearch();
        }
    }
});

// ============================================
// PROJECT SAVE/LOAD
// ============================================

function saveProject() {
    const projectData = {
        name: 'ziex-project',
        files: state.fileContents,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('ziex-project', JSON.stringify(projectData));
    showToast('Project saved to local storage', 'success');
}

function loadProject() {
    const saved = localStorage.getItem('ziex-project');
    if (saved) {
        try {
            const project = JSON.parse(saved);
            Object.assign(state.fileContents, project.files);
            renderFileTree();
            showToast('Project loaded successfully', 'success');
        } catch (e) {
            showToast('Failed to load project', 'error');
        }
    } else {
        showToast('No saved project found', 'info');
    }
}

function exportProject() {
    const projectData = {
        name: 'ziex-project',
        files: state.fileContents,
        timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ziex-project.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Project exported as ziex-project.json', 'success');
}

setInterval(() => {
    if (state.settings.autoSave) {
        saveProject();
    }
}, 30000);

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('load', () => {
    const saved = localStorage.getItem('ziex-project');
    if (saved) {
        try {
            const project = JSON.parse(saved);
            Object.assign(state.fileContents, project.files);
        } catch (e) {
            console.log('No saved project');
        }
    }
});

window.addEventListener('resize', () => {
    if (editor) editor.layout();
});
