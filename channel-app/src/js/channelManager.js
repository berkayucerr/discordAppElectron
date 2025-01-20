class ChannelManager {
    constructor() {
        this.currentServerId = null;
        this.peerConnection = null;
        this.localStream = null;
        this.socket = null;
        this.currentVoiceChannelId = null;
        this.userId = JSON.parse(localStorage.user).id;
        this.username = JSON.parse(localStorage.user).username;
        this.isUpdating = false;
        this.textSocket = null;  // Text kanalı için WebSocket
        this.voiceSocket = null; // Ses kanalı için WebSocket
    }

    async loadChannels(serverId) {
        console.log('Loading channels for server:', serverId);
        this.currentServerId = serverId;

        try {
            const channels = await api.getChannels(serverId);
            console.log('Channels loaded:', channels);
            this.displayChannels(channels);
        } catch (error) {
            console.error('Kanallar yüklenirken hata:', error);
        }
    }

    displayChannels(channels) {
        const container = document.getElementById('channelContainer');
        
        if (!container) {
            console.error('Channel container not found!');
            return;
        }
    
        if (!channels || channels.length === 0) {
            container.innerHTML = '';
            return;
        }
    
        container.innerHTML = channels.map(channel => `
            <div class="channel-item" 
                data-channel-id="${channel.id}" 
                data-channel-type="${channel.type}"
                onclick="channelManager.handleChannelClick('${channel.id}')"
            >
                <div class="channel-info">
                    <span class="channel-type">${channel.type === 'TEXT' ? '#' : '🔊'}</span>
                    <span class="channel-name">${channel.name}</span>
                </div>
                <div class="channel-actions">
                    <button class="channel-menu-btn" onclick="event.stopPropagation();">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="channel-menu">
                        <div class="menu-item" onclick="event.stopPropagation(); channelManager.editChannel('${channel.id}', '${channel.name}', '${channel.type}')">
                            <i class="fas fa-edit"></i> Düzenle
                        </div>
                        <div class="menu-item delete" onclick="event.stopPropagation(); channelManager.deleteChannel('${channel.id}')">
                            <i class="fas fa-trash-alt"></i> Sil
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    
        this.getParticipants(channels);
    
        // Menü işlemleri için event listener'ları ekle
        document.querySelectorAll('.channel-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Tüm açık menüleri kapat
                document.querySelectorAll('.channel-menu.active').forEach(menu => {
                    if (menu !== btn.nextElementSibling) {
                        menu.classList.remove('active');
                    }
                });
                // Tıklanan menüyü aç/kapat
                btn.nextElementSibling.classList.toggle('active');
            });
        });
    
        // Sayfa herhangi bir yerine tıklandığında menüleri kapat
        document.addEventListener('click', () => {
            document.querySelectorAll('.channel-menu.active').forEach(menu => {
                menu.classList.remove('active');
            });
        });
    }

    async getParticipants(channels) {
        for(let channel of channels){
            const users = await api.getVoiceChannelUsers(channel.id);
            this.displayVoiceChannelUsers(channel.id, users);
        }
    }

    showCreateChannelModal() {
        const modalHTML = `
            <div class="modal" id="createChannelModal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Yeni Kanal Oluştur</h2>
                        <button class="modal-close" onclick="channelManager.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="createChannelForm">
                        <div class="form-group">
                            <div class="input-container">
                                <label for="channelName">Kanal Adı</label>
                                <input 
                                    type="text" 
                                    id="channelName" 
                                    class="form-input"
                                    placeholder="Kanalınız için bir isim girin"
                                    required
                                >
                            </div>
                            <div class="input-container">
                                <label for="channelType">Kanal Türü</label>
                                <select id="channelType" class="form-input">
                                    <option value="TEXT">
                                        <i class="fas fa-hashtag"></i> Metin Kanalı
                                    </option>
                                    <option value="VOICE">
                                        <i class="fas fa-microphone"></i> Ses Kanalı
                                    </option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="channelManager.closeModal()">
                                İptal
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-plus"></i>
                                Kanal Oluştur
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Modal dışına tıklandığında kapatma
        const modal = document.getElementById('createChannelModal');
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            channelManager.closeModal();
        });

        // Form submit olayını dinle
        const form = document.getElementById('createChannelForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            channelManager.createChannel();
        });
    }

    async createChannel() {
        const name = document.getElementById('channelName').value;
        const type = document.getElementById('channelType').value;

        if (!name) {
            alert('Lütfen kanal adı girin');
            return;
        }

        try {
            await api.createChannel(this.currentServerId, name, type);
            this.closeModal();
            this.loadChannels(this.currentServerId);
        } catch (error) {
            console.error('Kanal oluşturulurken hata:', error);
            alert('Kanal oluşturulurken bir hata oluştu');
        }
    }

    closeModal() {
        const modal = document.getElementById('createChannelModal');
        if (modal) {
            modal.remove();
        }
    }

    async deleteChannel(channelId) {
        if (confirm('Bu kanalı silmek istediğinizden emin misiniz?')) {
            try {
                await api.deleteChannel(this.currentServerId, channelId);
                this.loadChannels(this.currentServerId);
            } catch (error) {
                console.error('Kanal silinirken hata:', error);
                alert('Kanal silinirken bir hata oluştu');
            }
        }
    }

    editChannel(channelId, currentName, currentType) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'editChannelModal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Kanalı Düzenle</h3>
                    <button class="modal-close" onclick="channelManager.closeEditModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="editChannelForm">
                    <div class="form-group">
                        <div class="input-container">
                            <label for="editChannelName">Kanal Adı</label>
                            <input 
                                type="text" 
                                id="editChannelName" 
                                class="form-input"
                                value="${currentName}"
                                placeholder="Kanal adı girin"
                                required
                            >
                        </div>
                        <div class="input-container">
                            <label for="editChannelType">Kanal Türü</label>
                            <select id="editChannelType" class="form-input">
                                <option value="TEXT" ${currentType === 'TEXT' ? 'selected' : ''}>
                                    <i class="fas fa-hashtag"></i> Metin Kanalı
                                </option>
                                <option value="VOICE" ${currentType === 'VOICE' ? 'selected' : ''}>
                                    <i class="fas fa-microphone"></i> Ses Kanalı
                                </option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="channelManager.closeEditModal()">
                            İptal
                        </button>
                        <button type="button" class="btn btn-primary" onclick="channelManager.updateChannel('${channelId}')">
                            <i class="fas fa-save"></i>
                            Güncelle
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Modal dışına tıklandığında kapatma
        const modalOverlay = modal.querySelector('.modal-overlay');
        modalOverlay.addEventListener('click', () => {
            channelManager.closeEditModal();
        });

        // Input'a otomatik fokus
        setTimeout(() => {
            const input = document.getElementById('editChannelName');
            input.focus();
            input.select();
        }, 100);

        // Enter tuşu ile güncelleme
        const form = modal.querySelector('#editChannelForm');
        form.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                channelManager.updateChannel(channelId);
            }
        });
    }

    async updateChannel(channelId) {
        // İşlem devam ederken yeni istekleri engelle
        if (this.isUpdating) return;
        
        const name = document.getElementById('editChannelName').value;
        const type = document.getElementById('editChannelType').value;

        if (!name) {
            alert('Lütfen kanal adı girin');
            return;
        }

        try {
            this.isUpdating = true; // İşlem başladı
            
            // Güncelleme butonunu devre dışı bırak
            const updateButton = document.querySelector('.btn-primary');
            if (updateButton) {
                updateButton.disabled = true;
                updateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Güncelleniyor...';
            }

            // Tek bir API isteği
            await api.updateChannel(this.currentServerId, channelId, name, type);
            
            this.closeEditModal();
            await this.loadChannels(this.currentServerId);

        } catch (error) {
            console.error('Kanal güncellenirken hata:', error);
            alert('Kanal güncellenirken bir hata oluştu');
        } finally {
            this.isUpdating = false; // İşlem bitti
            const updateButton = document.querySelector('.btn-primary');
            if (updateButton) {
                updateButton.disabled = false;
                updateButton.innerHTML = '<i class="fas fa-save"></i> Güncelle';
            }
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editChannelModal');
        if (modal) {
            modal.remove();
        }
    }

    async connectToVoiceChannel(channelId) {
        try {
            // Eğer zaten bu kanala bağlıysak, kanaldan ayrıl
            if (this.currentVoiceChannelId === channelId) {
                await this.leaveVoiceChannel(channelId);
                this.currentVoiceChannelId = null;
                return;
            }

            // Eğer başka bir kanala bağlıysak, önce oradan ayrıl
            if (this.currentVoiceChannelId) {
                await this.leaveVoiceChannel(this.currentVoiceChannelId);
            }

            const statusIndicator = document.getElementById('connectionStatus');
            statusIndicator.textContent = 'Bağlanıyor...';
            statusIndicator.className = 'status-indicator connecting';

            // 1. Mikrofon erişimi
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true,
                video: false 
            });

            // 2. WebSocket bağlantısı
            this.voiceSocket = new WebSocket('ws://localhost:8080/ws');

            // WebSocket event handler'larını promise ile yönet
            await new Promise((resolve, reject) => {
                this.voiceSocket.onopen = () => {
                    console.log('Voice WebSocket bağlantısı kuruldu');
                    // Kanala katılma mesajını gönder
                    this.voiceSocket.send(JSON.stringify({
                        action: 'joinVoiceChannel',
                        channelId: channelId,
                        userId: this.userId
                    }));
                    resolve();
                };

                this.voiceSocket.onmessage = (event) => {
                    try {
                        // Gelen veri boş değilse parse et
                        if (event.data) {
                            const message = JSON.parse(event.data);
                            this.handleSocketMessage(message);
                        }
                    } catch (error) {
                        console.warn('WebSocket mesajı işlenirken hata:', error);
                    }
                };

                this.voiceSocket.onerror = (error) => {
                    console.error('Voice WebSocket hatası:', error);
                    reject(error);
                };

                this.voiceSocket.onclose = () => {
                    console.log('Voice WebSocket bağlantısı kapandı');
                    if (this.currentVoiceChannelId) {
                        this.leaveVoiceChannel(this.currentVoiceChannelId);
                    }
                };

                setTimeout(() => reject(new Error('WebSocket bağlantı zaman aşımı')), 5000);
            });

            // 3. WebRTC başlatma
            await this.initializeWebRTC(channelId);

            // 4. Durum güncellemeleri
            this.currentVoiceChannelId = channelId;
            statusIndicator.textContent = 'Bağlandı';
            statusIndicator.className = 'status-indicator connected';

        } catch (error) {
            console.error('Ses kanalına bağlanma hatası:', error);
            const statusIndicator = document.getElementById('connectionStatus');
            statusIndicator.textContent = 'Bağlantı Hatası: ' + error.message;
            statusIndicator.className = 'status-indicator disconnected';
            
            // Hata durumunda kaynakları temizle
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
            }
            if (this.voiceSocket) {
                this.voiceSocket.close();
            }
            if (this.peerConnection) {
                this.peerConnection.close();
            }
        }
    }

    async initializeWebRTC(channelId) {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        // Ses akışını ekle
        this.localStream.getTracks().forEach(track => {
            console.log('Ses track\'i ekleniyor:', track);
            this.peerConnection.addTrack(track, this.localStream);
        });

        // ICE Candidate olayını dinle
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.voiceSocket?.readyState === WebSocket.OPEN) {
                console.log('ICE aday gönderiliyor:', event.candidate);
                this.voiceSocket.send(JSON.stringify({
                    action: 'iceCandidate',
                    channelId: channelId,
                    candidate: event.candidate
                }));
            }
        };

        // Bağlantı durumu değişikliklerini izle
        this.peerConnection.onconnectionstatechange = () => {
            console.log('WebRTC bağlantı durumu:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'connected') {
                console.log('WebRTC bağlantısı başarılı!');
            }
        };

        // Uzak ses akışını dinle
        this.peerConnection.ontrack = (event) => {
            console.log('Uzak ses track\'i alındı:', event.streams[0]);
            const remoteAudio = new Audio();
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.autoplay = true;
            remoteAudio.volume = 1.0;
            document.body.appendChild(remoteAudio);
        };

        try {
            // Offer oluştur ve gönder
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: false
            });
            
            console.log('WebRTC offer oluşturuldu:', offer);
            await this.peerConnection.setLocalDescription(offer);
            
            if (this.voiceSocket?.readyState === WebSocket.OPEN) {
                this.voiceSocket.send(JSON.stringify({
                    action: 'webrtcOffer',
                    channelId: channelId,
                    offer: offer
                }));
            } else {
                throw new Error('Voice WebSocket bağlantısı kapalı');
            }
        } catch (error) {
            console.error('WebRTC offer oluşturma hatası:', error);
            throw error;
        }
    }

    async handleSocketMessage(message) {
        if (!message) return;
        
        console.log('Sunucudan gelen mesaj:', message);

        const statusIndicator = document.getElementById('connectionStatus');

        switch (message.type) {
            case 'joinResponse':
                console.log('Kanala katılma yanıtı:', message.status);
                if (message.status === 'success') {
                    statusIndicator.textContent = 'Bağlandı';
                    statusIndicator.className = 'status-indicator connected';
                }
                break;

            case 'webrtcAnswer':
                console.log('WebRTC cevabı alındı');
                try {
                    if (message.answer && this.peerConnection) {
                        await this.peerConnection.setRemoteDescription(
                            new RTCSessionDescription(message.answer)
                        );
                    }
                } catch (error) {
                    console.error('Remote Description hatası:', error);
                }
                break;

            case 'iceCandidate':
                console.log('ICE adayı alındı');
                try {
                    if (message.candidate && this.peerConnection) {
                        await this.peerConnection.addIceCandidate(
                            new RTCIceCandidate(message.candidate)
                        );
                    }
                } catch (error) {
                    console.error('ICE aday ekleme hatası:', error);
                }
                break;

            case 'userJoined':
                console.log('Yeni kullanıcı katıldı:', message.user);
                if (message.channelId) {
                    const users = await api.getVoiceChannelUsers(message.channelId);
                    this.displayVoiceChannelUsers(message.channelId, users);
                    this.showNotification(`${message.user.username} kanala katıldı`);
                }
                break;
            
            case 'userLeft':
                console.log('Kullanıcı ayrıldı:', message.user);
                if (message.channelId) {
                    const users = await api.getVoiceChannelUsers(message.channelId);
                    this.displayVoiceChannelUsers(message.channelId, users);
                    this.showNotification(`${message.user.username} kanaldan ayrıldı`);
                }
                break;

            default:
                console.log('Bilinmeyen mesaj tipi:', message.type);
                break;
        }
    }

    async leaveVoiceChannel(channelId) {
        const statusIndicator = document.getElementById('connectionStatus');
        statusIndicator.textContent = 'Bağlantı Kesiliyor...';
        statusIndicator.className = 'status-indicator disconnected';

        if (this.voiceSocket && this.voiceSocket.readyState === WebSocket.OPEN) {
            this.voiceSocket.send(JSON.stringify({
                action: 'leave',
                channelId: channelId,
                userId: this.userId
            }));
            this.voiceSocket.close();
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }

        if (this.peerConnection) {
            this.peerConnection.close();
        }

        this.currentVoiceChannelId = null;
        this.voiceSocket = null;
        this.peerConnection = null;
        this.localStream = null;

        // Status'u güncelle
        statusIndicator.textContent = 'Bağlantı Kesildi';
    }

    displayVoiceChannelUsers(channelId, users) {
        const channelItem = document.querySelector(`[data-channel-id="${channelId}"]`);
        
        if (!channelItem) return;

        // Mevcut kullanıcı listesi konteynerini temizle
        const existingUserList = channelItem.querySelector('.voice-users');
        if (existingUserList) {
            existingUserList.remove();
        }

        // Yeni kullanıcı listesi oluştur
        const userListContainer = document.createElement('div');
        userListContainer.className = 'voice-users';
        
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = `voice-user ${user.speaking ? 'speaking' : ''}`; // Konuşan kullanıcı durumu
            userElement.innerHTML = `
                <div class="voice-user-wrapper">
                    <div class="voice-user-avatar">
                        <img src="${user.avatar || 'https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png'}" alt="${user.username}">
                        <div class="voice-indicator ${user.speaking ? 'active' : ''}">
                            <i class="fas fa-microphone"></i>
                        </div>
                    </div>
                    <div class="voice-user-info">
                        <span class="voice-user-name">${user.username || user.userId}</span>
                    </div>
                </div>
            `;
            userListContainer.appendChild(userElement);
        });

        channelItem.appendChild(userListContainer);
    }

    showNotification(message) {
        // Varsa eski notification container'ı temizle
        const existingContainer = document.getElementById('notificationContainer');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Notification container oluştur
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;

        // Notification elementini oluştur
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            background-color: #2f3136;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            margin-bottom: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out forwards;
            opacity: 0;
            transform: translateX(100%);
        `;

        // Animasyon için style ekle
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes fadeOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(style);

        notification.textContent = message;
        container.appendChild(notification);
        document.body.appendChild(container);

        // 3 saniye sonra bildirimi kaldır
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-in forwards';
            setTimeout(() => {
                container.remove();
            }, 300);
        }, 3000);
    }

    // Kanal tıklama işleyicisi
    async handleChannelClick(channelId) {
        console.log('Kanala tıklandı:', channelId);
        
        const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
        const channelType = channelElement.getAttribute('data-channel-type');

        // Aktif kanalı vurgula
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
        });
        channelElement.classList.add('active');

        // Ana içerik alanını bul
        const mainContent = document.querySelector('.main-content') || document.getElementById('mainContent');
        if (!mainContent) {
            console.error('Main content alanı bulunamadı');
            return;
        }

        // Mevcut içeriği koruyarak sadece channelContent'i güncelle
        let channelContent = document.getElementById('channelContent');
        if (!channelContent) {
            channelContent = document.createElement('div');
            channelContent.id = 'channelContent';
            mainContent.appendChild(channelContent);
        }

        // Kanal ID'sini sakla
        this.currentChannelId = channelId;

        if (channelType === 'VOICE') {
            this.connectToVoiceChannel(channelId);
        } else {
            // Text kanalı için WebSocket bağlantısını kur
            await this.initializeTextSocket(channelId);
            this.setupTextChannelUI(channelId);
            
            // Eski mesajları yükle
            try {
                const messages = await api.loadChannelMessages(channelId);
                this.displayOldMessages(messages);
            } catch (error) {
                console.error('Eski mesajlar yüklenirken hata:', error);
                this.showNotification('Eski mesajlar yüklenirken bir hata oluştu');
            }
        }
    }

    async initializeTextSocket(channelId) {
        // Eğer mevcut bir bağlantı varsa ve açıksa, yeni bağlantı kurmaya gerek yok
        if (this.textSocket && this.textSocket.readyState === WebSocket.OPEN) {
            return;
        }

        // Eğer mevcut bir bağlantı varsa ama kapalıysa, temizle
        if (this.textSocket) {
            this.textSocket.close();
            this.textSocket = null;
        }

        // Yeni WebSocket bağlantısı kur
        return new Promise((resolve, reject) => {
            try {
                this.textSocket = new WebSocket('ws://localhost:8080/ws');

                this.textSocket.onopen = () => {
                    console.log('Text WebSocket bağlantısı başarıyla kuruldu');
                    // Kanala katılma mesajı gönder
                    this.textSocket.send(JSON.stringify({
                        action: 'joinTextChannel',
                        channelId: channelId,
                        userId: this.userId
                    }));
                    this.setupTextSocketListeners();
                    resolve();
                };

                this.textSocket.onerror = (error) => {
                    console.error('Text WebSocket bağlantı hatası:', error);
                    reject(error);
                };

                // 5 saniye timeout ekle
                setTimeout(() => {
                    if (this.textSocket.readyState !== WebSocket.OPEN) {
                        reject(new Error('WebSocket bağlantı zaman aşımı'));
                    }
                }, 5000);

            } catch (error) {
                console.error('Text WebSocket başlatma hatası:', error);
                reject(error);
            }
        });
    }

    setupTextSocketListeners() {
        if (!this.textSocket) {
            console.error('Text WebSocket bağlantısı yok!');
            return;
        }

        this.textSocket.onmessage = (event) => {
            console.log('Text kanalı ham mesaj alındı:', event.data);
            try {
                const message = JSON.parse(event.data);
                console.log('İşlenmiş mesaj:', message);

                // Kendi gönderdiğimiz mesajları tekrar gösterme
                if (message.userId === this.userId) {
                    return;
                }

                // Mesaj tipine göre işle
                if (message.type === 'textMessage') {
                    console.log('Text mesajı alındı:', message);
                    this.displayTextMessage({
                        userId: message.userId,
                        content: message.content,
                        timestamp: new Date().toLocaleTimeString()
                    });
                }
            } catch (error) {
                console.error('Mesaj işleme hatası:', error);
                console.error('Ham mesaj:', event.data);
            }
        };

        this.textSocket.onerror = (error) => {
            console.error('Text WebSocket hatası:', error);
        };

        this.textSocket.onclose = () => {
            console.log('Text WebSocket bağlantısı kapandı');
            this.textSocket = null;
        };

        this.textSocket.onopen = () => {
            console.log('Text WebSocket bağlantısı açıldı');
            // Kanala katıldığımızı bildir
            this.textSocket.send(JSON.stringify({
                action: 'joinTextChannel',
                channelId: this.currentChannelId,
                userId: this.userId,
                username: this.username
            }));
        };
    }

    setupTextChannelUI(channelId) {
        const channelContent = document.getElementById('channelContent');
        if (!channelContent) {
            console.error('channelContent bulunamadı');
            return;
        }

        channelContent.innerHTML = `
            <div class="text-channel-container">
                <div class="messages-container" id="messagesContainer"></div>
                <div class="message-input-wrapper">
                    <div class="message-input-container">
                        <input 
                            type="text" 
                            id="messageInput" 
                            class="message-input"
                            placeholder="Mesajınızı yazın..."
                        >
                        <button id="sendMessageBtn" class="send-message-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const messageInput = document.getElementById('messageInput');
        const sendMessageBtn = document.getElementById('sendMessageBtn');

        if (!messageInput || !sendMessageBtn) {
            console.error('Mesaj input veya gönderme butonu bulunamadı');
            return;
        }

        const sendMessage = () => {
            const content = messageInput.value.trim();
            if (!content) return;

            console.log('WebSocket durumu:', this.textSocket?.readyState);
            console.log('Kanal ID:', channelId);

            if (this.textSocket?.readyState === WebSocket.OPEN) {
                const messageData = {
                    action: 'textMessage',
                    channelId: channelId,
                    content: content,
                    userId: this.userId,
                    username: this.username,
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString()
                };

                console.log('Mesaj gönderiliyor:', messageData);
                this.textSocket.send(JSON.stringify(messageData));
                
                // Kendi mesajımızı hemen göstermeyi kaldırdık
                messageInput.value = '';
            } else {
                console.error('Text WebSocket bağlantısı kapalı! Yeniden bağlanılıyor...');
                // WebSocket bağlantısını yeniden kur
                this.initializeTextSocket(channelId).then(() => {
                    sendMessage();
                }).catch(error => {
                    console.error('WebSocket yeniden bağlantı hatası:', error);
                    this.showNotification('Bağlantı hatası: Mesaj gönderilemedi');
                });
            }
        };

        sendMessageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sendMessage();
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        messageInput.focus();
    }

    displayTextMessage(message) {
        console.log('Mesaj görüntüleniyor:', message);
        const container = document.getElementById('messagesContainer');
        if (!container) {
            console.error('messagesContainer bulunamadı');
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message-item ${message.userId === this.userId ? 'own-message' : ''}`;
        
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${message.userId}</span>
                    <span class="message-time">${message.timestamp}</span>
                </div>
                <div class="message-text">${message.content}</div>
            </div>
        `;

        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;
    }

    // Eski mesajları yüklemek için yeni metod
    

    // Eski mesajları görüntülemek için yeni metod
    displayOldMessages(messages) {
        const container = document.getElementById('messagesContainer');
        if (!container) {
            console.error('messagesContainer bulunamadı');
            return;
        }

        // Mevcut mesajları temizle
        container.innerHTML = '';

        // Mesajları tarih sırasına göre sırala
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Her mesajı görüntüle
        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `message-item ${message.userId === this.userId ? 'own-message' : ''}`;
            
            const timestamp = new Date(message.timestamp).toLocaleTimeString();
            
            messageElement.innerHTML = `
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${message.userId}</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-text">${message.content}</div>
                </div>
            `;

            container.appendChild(messageElement);
        });

        // Scroll'u en alta getir
        container.scrollTop = container.scrollHeight;
    }
}

// Global instance
const channelManager = new ChannelManager();
