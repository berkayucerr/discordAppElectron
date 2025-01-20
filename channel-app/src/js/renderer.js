let currentServerId = null;

function showTab(tabName) {
    // Tüm tabları gizle
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    // Tüm tab butonlarından active sınıfını kaldır
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Seçili tab ve butonunu aktif yap
    document.getElementById(`${tabName}Tab`).style.display = 'block';
    document.getElementById(`${tabName}Tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // İçeriği yükle
    if (currentServerId) {
        switch(tabName) {
            case 'channels':
                channelManager.loadChannels(currentServerId);
                break;
            case 'settings':
                serverSettings.loadSettings();
                break;
            case 'roles':
                serverRoles.loadRoles();
                break;
        }
    }
}

function selectServer(serverId) {
    currentServerId = serverId;
    
    // Aktif tabı bul
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        showTab(activeTab.getAttribute('data-tab'));
    } else {
        showTab('channels');
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    serverManager = new ServerManager();
    channelManager = new ChannelManager();
    serverSettings = new ServerSettings(currentServerId);
    serverRoles = new ServerRoles(currentServerId);
    serverManager.loadServers();
});