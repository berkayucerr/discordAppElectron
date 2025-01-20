class ServerManager {
    constructor() {
        this.currentServerId = null;
        this.userId = JSON.parse(localStorage.user).id;
    }

    async loadServers() {
        try {
            const servers = await api.getServers();
            this.displayServers(servers);
        } catch (error) {
            console.error('Sunucular yüklenirken hata:', error);
            if (error.status === 400) {
                alert('Sunucular yüklenirken bir hata oluştu: Geçersiz istek');
            }
        }
    }

    displayServers(servers) {
        const serverList = document.getElementById('serverList');
        if (!serverList) {
            console.error('Server list container bulunamadı!');
            return;
        }

        serverList.innerHTML = servers && servers.length > 0 ? 
            servers.map(server => `
                <div class="server-item" 
                    data-server-id="${server.id}"
                    onclick="serverManager.selectServer('${server.id}')"
                    oncontextmenu="serverManager.showServerContextMenu(event, '${server.id}', '${server.name}', '${server.description || ''}'); return false;">
                    <div class="server-icon">
                        ${server.name.charAt(0).toUpperCase()}
                    </div>
                    <span class="server-name">${server.name}</span>
                </div>
            `).join('') 
            : '';

        // Kaydırma işlemlerini ekle
        this.initializeSwipeActions();
    }

    initializeSwipeActions() {
        const serverItems = document.querySelectorAll('.server-item');
        
        serverItems.forEach(item => {
            let startX = 0;
            let currentX = 0;
            let isDragging = false;

            // Touch Events
            item.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
                item.style.transition = 'none';
            });

            item.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                e.preventDefault();
                currentX = e.touches[0].clientX - startX;
                
                if (currentX < 0) {
                    if (currentX < -100) currentX = -100;
                    item.style.transform = `translateX(${currentX}px)`;
                }
            });

            // Mouse Events
            item.addEventListener('mousedown', (e) => {
                startX = e.clientX;
                isDragging = true;
                item.style.transition = 'none';
            });

            item.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                e.preventDefault();
                currentX = e.clientX - startX;
                
                if (currentX < 0) {
                    if (currentX < -100) currentX = -100;
                    item.style.transform = `translateX(${currentX}px)`;
                }
            });

            const resetPosition = () => {
                isDragging = false;
                item.style.transition = 'transform 0.3s ease';
                
                if (currentX < -50) {
                    item.style.transform = 'translateX(-100px)';
                    const serverId = item.getAttribute('data-server-id');
                    this.deleteServer(serverId);
                } else {
                    item.style.transform = 'translateX(0)';
                }
            };

            // Touch end events
            item.addEventListener('touchend', resetPosition);
            item.addEventListener('touchcancel', resetPosition);

            // Mouse end events
            item.addEventListener('mouseup', resetPosition);
            item.addEventListener('mouseleave', resetPosition);
        });
    }

    async createServer() {
        const name = document.getElementById('serverName').value.trim();
        const description = document.getElementById('serverDescription').value.trim();
        if (!name) {
            alert('Lütfen sunucu adı girin');
            return;
        }

        try {
            const response = await api.createServer({ 
                name: name, 
                description: description,
                ownerId: this.userId
            });
            
            if (!response || !response.id) {
                throw new Error('Sunucu oluşturma yanıtı geçersiz');
            }
            
            this.closeCreateServerModal();
            await this.loadServers();
        } catch (error) {
            console.error('Sunucu oluşturulurken hata:', error);
            alert(`Sunucu oluşturulurken bir hata oluştu: ${error.message}`);
        }
    }

    async deleteServer(serverId) {
        if (confirm('Bu sunucuyu silmek istediğinizden emin misiniz?')) {
            try {
                await api.deleteServer(serverId);
                if (this.currentServerId === serverId) {
                    this.currentServerId = null;
                }
                this.loadServers();
            } catch (error) {
                console.error('Sunucu silinirken hata:', error);
                if (error.status === 400) {
                    alert('Sunucu silinirken bir hata oluştu: Geçersiz sunucu ID');
                } else {
                    alert('Sunucu silinirken bir hata oluştu');
                }
            }
        }
    }

    selectServer(serverId) {
        this.currentServerId = serverId;
        channelManager.loadChannels(serverId);
        serverSettings = new ServerSettings(serverId);
        showTab('channels');
    }

    showCreateServerModal() {
        const modalHTML = `
            <div class="modal" id="createServerModal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Yeni Sunucu Oluştur</h2>
                    </div>
                    <form id="createServerForm">
                        <div class="form-group">
                            <div class="input-container">
                                <label for="serverName">Sunucu Adı</label>
                                <input 
                                    type="text" 
                                    id="serverName" 
                                    class="form-input"
                                    placeholder="Sunucunuz için bir isim girin"
                                    required
                                >
                            </div>
                            <div class="input-container">
                                <label for="serverDescription">Sunucu Açıklaması</label>
                                <textarea 
                                    id="serverDescription" 
                                    class="form-input"
                                    placeholder="Sunucunuz hakkında kısa bir açıklama yazın"
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="serverManager.closeCreateServerModal()">
                                İptal
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-plus"></i>
                                Sunucu Oluştur
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Modal dışına tıklandığında kapatma
        const modal = document.getElementById('createServerModal');
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeCreateServerModal();
        });

        const form = document.getElementById('createServerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createServer();
        });
    }

    closeCreateServerModal() {
        const modal = document.getElementById('createServerModal');
        if (modal) {
            modal.remove();
        }
    }

    startDeleteTimer(element, serverId) {
        this.deleteTimer = setTimeout(() => {
            element.classList.add('show-delete');
            this.confirmDelete(element, serverId);
        }, 1000); // 1 saniye basılı tutma süresi
    }

    cancelDeleteTimer(element) {
        if (this.deleteTimer) {
            clearTimeout(this.deleteTimer);
            element.classList.remove('show-delete');
        }
    }

    confirmDelete(element, serverId) {
        if (confirm('Bu sunucuyu silmek istediğinizden emin misiniz?')) {
            this.deleteServer(serverId);
        }
        element.classList.remove('show-delete');
    }

    showServerContextMenu(event, serverId, serverName, serverDescription) {
        event.preventDefault();
        
        // Varsa eski menüyü kaldır
        const oldMenu = document.querySelector('.context-menu');
        if (oldMenu) oldMenu.remove();

        // Yeni context menü oluştur
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.innerHTML = `
            <div class="menu-item" onclick="serverManager.showEditServerModal('${serverId}', '${serverName}', '${serverDescription}')">
                <i class="fas fa-cog"></i>
                <span>Sunucu Ayarlarını Düzenle</span>
            </div>
            <div class="menu-item delete" onclick="serverManager.deleteServer('${serverId}')">
                <i class="fas fa-trash-alt"></i>
                <span>Sunucuyu Sil</span>
            </div>
        `;

        // Menüyü konumlandır
        contextMenu.style.top = `${event.pageY}px`;
        contextMenu.style.left = `${event.pageX}px`;

        // Menüyü sayfaya ekle
        document.body.appendChild(contextMenu);

        // Menü dışına tıklandığında menüyü kapat
        document.addEventListener('click', function closeMenu(e) {
            if (!contextMenu.contains(e.target)) {
                contextMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    showEditServerModal(serverId, serverName, serverDescription) {
        const modalHTML = `
            <div class="modal" id="editServerModal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Sunucu Ayarlarını Düzenle</h2>
                        <button class="close-button" onclick="serverManager.closeEditServerModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="editServerForm">
                        <div class="form-group">
                            <label for="serverName">Sunucu Adı</label>
                            <input 
                                type="text" 
                                id="serverName" 
                                class="form-input"
                                value="${serverName}"
                                required
                            >
                        </div>
                        <div class="form-group">
                            <label for="serverDescription">Sunucu Açıklaması</label>
                            <input 
                                type="text" 
                                id="serverDescription" 
                                value="${serverDescription}"
                                class="form-input"
                                required
                            >
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="serverManager.closeEditServerModal()">
                                İptal
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Güncelle
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const form = document.getElementById('editServerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await api.updateServer({ 
                    id: serverId, 
                    name: document.getElementById('serverName').value,
                    description: document.getElementById('serverDescription').value ,
                    ownerId: this.userId
                });
                this.closeEditServerModal();
                this.loadServers(); // Sunucu listesini yenile
            } catch (error) {
                console.error('Sunucu güncellenirken hata:', error);
                alert('Sunucu güncellenirken bir hata oluştu');
            }
        });
    }

    closeEditServerModal() {
        const modal = document.getElementById('editServerModal');
        if (modal) {
            modal.remove();
        }
    }
}

// Global instance oluştur
const serverManager = new ServerManager();

// Sayfa yüklendiğinde sunucuları yükle
document.addEventListener('DOMContentLoaded', () => {
    serverManager.loadServers();
});

// Kanal tıklama olayını yöneten fonksiyon
const handleChannelClick = async (channel) => {
    console.log("Kanala tıklandı:", channel); // Debug için

    const contentArea = document.getElementById('channel-content');
    if (!contentArea) {
        console.error('channel-content elementi bulunamadı');
        return;
    }

    // İçeriği temizle
    contentArea.innerHTML = '';

    // Text kanalı kontrolü
    if (channel.type === 0) { // Discord.js'de text kanalı tipi 0'dır
        console.log("Text kanalı tespit edildi"); // Debug için

        // Container oluştur
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        // Mesaj alanı
        const messageArea = document.createElement('div');
        messageArea.className = 'message-area';

        // Input container
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';

        // Mesaj input
        const messageInput = document.createElement('input');
        messageInput.type = 'text';
        messageInput.className = 'message-input';
        messageInput.placeholder = 'Mesajınızı yazın...';

        // Gönder butonu
        const sendButton = document.createElement('button');
        sendButton.className = 'send-button';
        sendButton.textContent = 'Gönder';

        // Elementleri birleştir
        inputContainer.appendChild(messageInput);
        inputContainer.appendChild(sendButton);
        messageContainer.appendChild(messageArea);
        messageContainer.appendChild(inputContainer);
        contentArea.appendChild(messageContainer);

        // Backend'den mesajları al
        try {
            const response = await fetch(`http://localhost:3000/messages/${channel.id}`);
            const messages = await response.json();
            
            messages.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.className = 'message';
                messageElement.innerHTML = `
                    <span class="author">${msg.author}</span>
                    <span class="content">${msg.content}</span>
                `;
                messageArea.appendChild(messageElement);
            });
        } catch (error) {
            console.error('Mesajlar yüklenemedi:', error);
        }

        // Mesaj gönderme işlevi
        const sendMessage = async () => {
            const content = messageInput.value.trim();
            if (content) {
                try {
                    const response = await fetch('http://localhost:3000/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            channelId: channel.id,
                            content: content
                        })
                    });

                    if (response.ok) {
                        messageInput.value = '';
                        const newMessage = await response.json();
                        const messageElement = document.createElement('div');
                        messageElement.className = 'message';
                        messageElement.innerHTML = `
                            <span class="author">${newMessage.author}</span>
                            <span class="content">${newMessage.content}</span>
                        `;
                        messageArea.appendChild(messageElement);
                        messageArea.scrollTop = messageArea.scrollHeight;
                    }
                } catch (error) {
                    console.error('Mesaj gönderilemedi:', error);
                }
            }
        };

        // Click ve Enter olayları
        sendButton.onclick = sendMessage;
        messageInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        };
    }
};

// Kanal listesi oluşturulurken tıklama olayını ekleyin
const createChannelElement = (channel) => {
    const channelElement = document.createElement('div');
    channelElement.className = 'channel';
    channelElement.textContent = channel.name;
    
    // Tıklama olayını ekle
    channelElement.addEventListener('click', () => {
        console.log("Kanal elementine tıklandı"); // Debug için
        handleChannelClick(channel);
    });
    
    return channelElement;
};
