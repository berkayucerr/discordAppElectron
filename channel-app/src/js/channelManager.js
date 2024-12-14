class ChannelManager {
    constructor() {
        this.currentServerId = null;
        this.peerConnection = null;
        this.localStream = null;
        this.socket = null;
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
            container.innerHTML = '<p>Bu sunucuda henüz kanal bulunmamaktadır.</p>';
            return;
        }
    
        // Önce HTML'i oluşturalım
        container.innerHTML = channels.map(channel => `
            <div class="channel-item" data-channel-id="${channel.id}" data-channel-type="${channel.type}" style="cursor: pointer;">
                <div class="channel-info">
                    <span class="channel-type">${channel.type === 'TEXT' ? '#' : '🔊'}</span>
                    <span class="channel-name">${channel.name}</span>
                </div>
                <div class="channel-actions">
                    <button class="edit-btn" onclick="event.stopPropagation(); channelManager.editChannel('${channel.id}', '${channel.name}', '${channel.type}')">
                        Düzenle
                    </button>
                    <button class="delete-btn" onclick="event.stopPropagation(); channelManager.deleteChannel('${channel.id}')">
                        Sil
                    </button>
                </div>
            </div>
        `).join('');
    
        // Tıklama olaylarını ekleyelim
        const channelItems = container.getElementsByClassName('channel-item');
        Array.from(channelItems).forEach(item => {
            console.log('Kanal öğesine tıklama olayı ekleniyor:', item); // Debug için log
            item.addEventListener('click', (event) => {
                console.log('Kanala tıklandı!'); // Debug için log
                const channelId = item.getAttribute('data-channel-id');
                const channelType = item.getAttribute('data-channel-type');
                console.log('Kanal tipi:', channelType); // Debug için log
                
                if (channelType === 'VOICE') {
                    console.log('Ses kanalına bağlanılıyor...'); // Debug için log
                    this.connectToVoiceChannel(channelId);
                }
            });
        });
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
            <div class="modal-content">
                <h3>Kanalı Düzenle</h3>
                <div class="form-group">
                    <label for="editChannelName">Kanal Adı:</label>
                    <input type="text" id="editChannelName" value="${currentName}" placeholder="Kanal adı girin">
                </div>
                <div class="form-group">
                    <label for="editChannelType">Kanal Türü:</label>
                    <select id="editChannelType">
                        <option value="TEXT" ${currentType === 'TEXT' ? 'selected' : ''}>Metin Kanalı</option>
                        <option value="VOICE" ${currentType === 'VOICE' ? 'selected' : ''}>Ses Kanalı</option>
                    </select>
                </div>
                <div class="modal-buttons">
                    <button onclick="channelManager.updateChannel('${channelId}')">Güncelle</button>
                    <button class="cancel-btn" onclick="channelManager.closeEditModal()">İptal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    async updateChannel(channelId) {
        const name = document.getElementById('editChannelName').value;
        const type = document.getElementById('editChannelType').value;

        if (!name) {
            alert('Lütfen kanal adı girin');
            return;
        }

        try {
            await api.updateChannel(this.currentServerId, channelId, name, type);
            this.closeEditModal();
            this.loadChannels(this.currentServerId);
        } catch (error) {
            console.error('Kanal güncellenirken hata:', error);
            alert('Kanal güncellenirken bir hata oluştu');
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editChannelModal');
        if (modal) {
            modal.remove();
        }
    }

    async connectToVoiceChannel(channelId) {
        const statusIndicator = document.getElementById('connectionStatus');
        statusIndicator.textContent = 'Bağlanıyor...';
        statusIndicator.className = 'status-indicator connecting';

        try {
            // 1. Mikrofon erişimi
            console.log('Mikrofon erişimi isteniyor...');
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true,
                video: false 
            });
            console.log('Mikrofon erişimi başarılı');

            // 2. WebSocket bağlantısı
            console.log('WebSocket bağlantısı kuruluyor...');
            this.socket = new WebSocket('ws://localhost:8080/ws');

            this.socket.onopen = async () => {
                console.log('WebSocket bağlantısı kuruldu');
                
                // 3. WebRTC başlatma
                this.initializeWebRTC(channelId);
                
                // 4. Kanala katılma isteği gönder
                this.socket.send(JSON.stringify({
                    action: 'joinVoiceChannel',
                    channelId: channelId
                }));
                console.log('Kanala katılma isteği gönderildi');
                
                // Bağlantı başarılı olduğunda status'u güncelle
                statusIndicator.textContent = 'Bağlandı';
                statusIndicator.className = 'status-indicator connected';
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket hatası:', error);
                statusIndicator.textContent = 'Bağlantı Hatası!';
                statusIndicator.className = 'status-indicator disconnected';
            };

            this.socket.onclose = () => {
                console.log('WebSocket bağlantısı kapandı');
                statusIndicator.textContent = 'Bağlantı Kesildi';
                statusIndicator.className = 'status-indicator disconnected';
            };

            this.socket.onmessage = this.handleSocketMessage.bind(this);

        } catch (error) {
            console.error('Bağlantı hatası:', error);
            statusIndicator.textContent = 'Bağlantı Hatası: ' + error.message;
            statusIndicator.className = 'status-indicator disconnected';
        }
    }

    initializeWebRTC(channelId) {
        console.log('WebRTC başlatılıyor...');
        
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        // Ses akışını ekle
        this.localStream.getTracks().forEach(track => {
            console.log('Ses parçası ekleniyor:', track.kind);
            this.peerConnection.addTrack(track, this.localStream);
        });

        // ICE Candidate olayını dinle
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('ICE aday bulundu:', event.candidate);
                this.socket.send(JSON.stringify({
                    action: 'iceCandidate',
                    channelId: channelId,
                    candidate: {
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex
                    }
                }));
            }
        };

        // Uzak ses akışını dinle
        this.peerConnection.ontrack = (event) => {
            console.log('Uzak ses akışı alındı');
            const remoteAudio = new Audio();
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.autoplay = true;
            document.body.appendChild(remoteAudio);
        };

        // WebRTC teklifi oluştur ve gönder
        this.createAndSendOffer(channelId);
    }

    async createAndSendOffer(channelId) {
        try {
            console.log('WebRTC teklifi oluşturuluyor...');
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            this.socket.send(JSON.stringify({
                action: 'webrtcOffer',
                channelId: channelId,
                offer: offer
            }));
            console.log('WebRTC teklifi gönderildi');
        } catch (error) {
            console.error('Teklif oluşturma hatası:', error);
        }
    }

    async handleSocketMessage(event) {
        const message = JSON.parse(event.data);
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
                    await this.peerConnection.setRemoteDescription(
                        new RTCSessionDescription(message.answer)
                    );
                    console.log('Remote Description ayarlandı');
                } catch (error) {
                    console.error('Remote Description hatası:', error);
                }
                break;

            case 'iceCandidate':
                console.log('ICE adayı alındı');
                try {
                    await this.peerConnection.addIceCandidate(
                        new RTCIceCandidate(message.candidate)
                    );
                    console.log('ICE adayı eklendi');
                } catch (error) {
                    console.error('ICE aday ekleme hatası:', error);
                }
                break;
        }
    }

    async leaveVoiceChannel(channelId) {
        if (this.socket) {
            this.socket.send(JSON.stringify({
                action: 'leave',
                channelId: channelId
            }));
            this.socket.close();
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }

        if (this.peerConnection) {
            this.peerConnection.close();
        }

        // Ses kontrollerini kaldır
        const audioControls = document.querySelector('.audio-controls');
        if (audioControls) {
            audioControls.remove();
        }

        this.socket = null;
        this.peerConnection = null;
        this.localStream = null;
    }
}

// Global instance
const channelManager = new ChannelManager();
