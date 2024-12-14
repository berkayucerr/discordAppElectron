class ServerRoles {
    constructor(serverId) {
        this.serverId = serverId;
    }

    async loadRoles() {
        try {
            const roles = await api.getServerRoles(this.serverId);
            this.displayRoles(roles);
        } catch (error) {
            console.error('Roller yüklenirken hata:', error);
        }
    }

    displayRoles(roles) {
        const container = document.getElementById('rolesContainer');
        container.innerHTML = roles && roles.length > 0 ? roles.map(role => `
            <div class="role-item">
                <div class="role-info">
                    <strong>${role.roleName}</strong>
                </div>
                <div class="role-actions">
                    <button onclick="serverRoles.editRole('${role.id}', '${role.roleName}')">
                        Düzenle
                    </button>
                    <button class="delete-btn" onclick="serverRoles.deleteRole('${role.id}')">
                        Sil
                    </button>
                </div>
            </div>
        `).join('') : '<p>Henüz rol bulunmamaktadır.</p>';
    }

    showAddRoleModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'addRoleModal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Yeni Rol Ekle</h3>
                <div class="form-group">
                    <label for="roleName">Rol Adı:</label>
                    <input type="text" id="roleName" placeholder="Rol adını girin">
                </div>
                <div class="modal-buttons">
                    <button onclick="serverRoles.saveRole()">Kaydet</button>
                    <button class="cancel-btn" onclick="serverRoles.closeModal('addRoleModal')">İptal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    async saveRole() {
        const roleName = document.getElementById('roleName').value;

        if (!roleName) {
            alert('Lütfen rol adını girin');
            return;
        }

        try {
            await api.createServerRole(this.serverId, roleName);
            this.closeModal('addRoleModal');
            this.loadRoles();
        } catch (error) {
            console.error('Rol kaydedilirken hata:', error);
            alert('Rol kaydedilirken bir hata oluştu');
        }
    }

    editRole(id, name) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'editRoleModal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Rol Düzenle</h3>
                <div class="form-group">
                    <label for="editRoleName">Rol Adı:</label>
                    <input type="text" id="editRoleName" value="${name}">
                </div>
                <div class="modal-buttons">
                    <button onclick="serverRoles.updateRole('${id}')">Güncelle</button>
                    <button class="cancel-btn" onclick="serverRoles.closeModal('editRoleModal')">İptal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    async updateRole(roleId) {
        const roleName = document.getElementById('editRoleName').value;

        if (!roleName) {
            alert('Lütfen rol adını girin');
            return;
        }

        try {
            await api.updateServerRole(this.serverId, roleId, roleName);
            this.closeModal('editRoleModal');
            this.loadRoles();
        } catch (error) {
            console.error('Rol güncellenirken hata:', error);
            alert('Rol güncellenirken bir hata oluştu');
        }
    }

    async deleteRole(roleId) {
        if (confirm('Bu rolü silmek istediğinizden emin misiniz?')) {
            try {
                await api.deleteServerRole(this.serverId, roleId);
                this.loadRoles();
            } catch (error) {
                console.error('Rol silinirken hata:', error);
                alert('Rol silinirken bir hata oluştu');
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }
}

// Global instance oluştur
let serverRoles = null; 