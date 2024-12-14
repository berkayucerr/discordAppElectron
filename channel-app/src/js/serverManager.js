class ServerManager {
    constructor() {
        this.currentServerId = null;
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
                <div class="server-item" onclick="serverManager.selectServer('${server.id}')">
                    <div class="server-info">
                        <h3>${server.name}</h3>
                        <p>${server.description || ''}</p>
                    </div>
                    <div class="server-actions">
                        <button onclick="event.stopPropagation(); serverManager.deleteServer('${server.id}')" class="delete-btn">Sil</button>
                    </div>
                </div>
            `).join('') 
            : '<p>Henüz sunucu bulunmamaktadır.</p>';
    }

    async createServer() {
        const name = document.getElementById('serverName').value.trim();
        const description = document.getElementById('serverDescription').value.trim();
        const ownerId = "1";
        if (!name) {
            alert('Lütfen sunucu adı girin');
            return;
        }

        try {
            const response = await api.createServer({ 
                name: name, 
                description: description,
                ownerId: ownerId
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
}

// Global instance oluştur
const serverManager = new ServerManager();

// Sayfa yüklendiğinde sunucuları yükle
document.addEventListener('DOMContentLoaded', () => {
    serverManager.loadServers();
});
