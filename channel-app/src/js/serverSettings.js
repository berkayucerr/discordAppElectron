class ServerSettings {
    constructor(serverId) {
        this.serverId = serverId;
        console.log('ServerSettings initialized with serverId:', serverId);
        this.loadSettings()
    }

    async loadSettings() {
        try {
            console.log('Loading settings for server:', this.serverId);
            const settings = await api.getServerSettings(this.serverId);
            console.log('Loaded settings:', settings);
            this.displaySettings(settings);
        } catch (error) {
            console.error('Ayarlar yüklenirken hata:', error);
        }
    }

    displaySettings(settings) {
        console.log('Displaying settings:', settings);

        const container = document.getElementById('settingsContainer');
        container.innerHTML = `
            <div class="settings-list">
                ${settings && settings.length > 0 ? settings.map(setting => `
                    <div class="setting-item">
                        <div class="setting-info">
                            <strong>${setting.settingsKey || 'Undefined Key'}</strong>
                            <p>${setting.settingsValue || 'Undefined Value'}</p>
                        </div>
                        <div class="setting-actions">
                            <button onclick="serverSettings.editSetting('${setting.id}', '${setting.settingsKey}', '${setting.settingsValue}')">
                                Düzenle
                            </button>
                            <button class="delete-btn" onclick="serverSettings.deleteSetting('${setting.id}')">
                                Sil
                            </button>
                        </div>
                    </div>
                `).join('') : '<p>Henüz ayar bulunmamaktadır.</p>'}
            </div>
        `;
    }

    showAddSettingModal() {
        this.closeAllModals();

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'addSettingModal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Yeni Ayar Ekle</h3>
                <div class="form-group">
                    <label for="settingKey">Ayar Anahtarı:</label>
                    <input type="text" id="settingKey" placeholder="Ayar anahtarını girin">
                </div>
                <div class="form-group">
                    <label for="settingValue">Ayar Değeri:</label>
                    <input type="text" id="settingValue" placeholder="Ayar değerini girin">
                </div>
                <div class="modal-buttons">
                    <button onclick="serverSettings.saveSetting()">Kaydet</button>
                    <button class="cancel-btn" onclick="serverSettings.closeAllModals()">İptal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    async saveSetting() {
        console.log('saveSetting called');
        
        const keyInput = document.getElementById('settingKey');
        const valueInput = document.getElementById('settingValue');

        console.log('Input elements:', { keyInput, valueInput });

        if (!keyInput || !valueInput) {
            console.error('Input elements not found');
            return;
        }

        const key = keyInput.value.trim();
        const value = valueInput.value.trim();

        console.log('Setting values:', { key, value });

        if (!key || !value) {
            alert('Lütfen tüm alanları doldurun');
            return;
        }

        try {
            console.log('Calling API with:', {
                serverId: this.serverId,
                key,
                value
            });

            const result = await api.createServerSetting(this.serverId, key, value);
            console.log('API result:', result);

            this.closeAllModals();
            await this.loadSettings();
        } catch (error) {
            console.error('Setting save error:', error);
            alert('Ayar kaydedilirken bir hata oluştu');
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.remove());
    }

    editSetting(id, key, value) {
        this.closeAllModals();

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'editSettingModal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Ayar Düzenle</h3>
                <div class="form-group">
                    <label for="editSettingKey">Ayar Anahtarı:</label>
                    <input type="text" id="editSettingKey" value="${key}">
                </div>
                <div class="form-group">
                    <label for="editSettingValue">Ayar Değeri:</label>
                    <input type="text" id="editSettingValue" value="${value}">
                </div>
                <div class="modal-buttons">
                    <button onclick="serverSettings.updateSetting('${id}')">Güncelle</button>
                    <button class="cancel-btn" onclick="serverSettings.closeAllModals()">İptal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    async updateSetting(settingId) {
        const key = document.getElementById('editSettingKey').value;
        const value = document.getElementById('editSettingValue').value;

        if (!key || !value) {
            alert('Lütfen tüm alanları doldurun');
            return;
        }

        try {
            await api.updateServerSetting(this.serverId, settingId, key, value);
            this.closeAllModals();
            this.loadSettings();
        } catch (error) {
            console.error('Ayar güncellenirken hata:', error);
            alert('Ayar güncellenirken bir hata oluştu');
        }
    }

    async deleteSetting(settingId) {
        if (confirm('Bu ayarı silmek istediğinizden emin misiniz?')) {
            try {
                await api.deleteServerSetting(this.serverId, settingId);
                this.loadSettings();
            } catch (error) {
                console.error('Ayar silinirken hata:', error);
                alert('Ayar silinirken bir hata oluştu');
            }
        }
    }

    closeModal(modalId) {
        this.closeAllModals();
    }
}

// Global instance
let serverSettings = null;
