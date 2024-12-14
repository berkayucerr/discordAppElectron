const API_URL = 'http://127.0.0.1:8081';

class Api {
    async getServers() {
        try {
            const response = await fetch(`${API_URL}/api/servers`);
            return await response.json();
        } catch (error) {
            console.error('Sunucular alınırken hata:', error);
            throw error;
        }
    }

    
    async getChannels(serverId) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/channels`);
            return await response.json();
        } catch (error) {
            console.error('Kanallar alınırken hata:', error);
            throw error;
        }
    }

    async createChannel(serverId, name, type) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/channels?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
                method: 'POST'
            });
            return await response.json();
        } catch (error) {
            console.error('Kanal oluşturulurken hata:', error);
            throw error;
        }
    }

    async deleteServer(serverId) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Sunucu silinirken hata:', error);
            throw error;
        }
    }

    async deleteChannel(serverId, channelId) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/channels/${channelId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Kanal silinirken hata:', error);
            throw error;
        }
    }

    // Rol işlemleri
    async getRoles(serverId) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/roles`);
            return await response.json();
        } catch (error) {
            console.error('Roller alınırken hata:', error);
            throw error;
        }
    }

    async createRole(serverId, roleData) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(roleData)
            });
            return await response.json();
        } catch (error) {
            console.error('Rol oluşturulurken hata:', error);
            throw error;
        }
    }

    async deleteRole(serverId, roleId) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/roles/${roleId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Rol silinirken hata:', error);
            throw error;
        }
    }

    // Ayarlar işlemleri
    async getSettings(serverId) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/settings`);
            return await response.json();
        } catch (error) {
            console.error('Ayarlar alınırken hata:', error);
            throw error;
        }
    }

    async saveSetting(serverId, settingData) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settingData)
            });
            return await response.json();
        } catch (error) {
            console.error('Ayar kaydedilirken hata:', error);
            throw error;
        }
    }

    async deleteSetting(serverId, settingId) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/settings/${settingId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Ayar silinirken hata:', error);
            throw error;
        }
    }

    async updateChannel(serverId, channelId, name, type) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/channels/${channelId}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
                method: 'PUT'
            });
            return await response.json();
        } catch (error) {
            console.error('Kanal güncellenirken hata:', error);
            throw error;
        }
    }

    // Server Settings endpoints
    async getServerSettings(serverId) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/settings`);
            
            console.log('Get settings response:', response);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Settings data:', data);
            return data;
        } catch (error) {
            console.error('Settings yüklenirken hata:', error);
            throw error;
        }
    }

    async createServerSetting(serverId, settingKey, settingValue) {
        console.log('API createServerSetting çağrıldı:', {
            serverId,
            settingKey,
            settingValue
        });

        try {
            const response = await fetch(
                `${API_URL}/api/servers/${serverId}/settings`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        serverId: serverId,
                        settingsKey: settingKey,
                        settingsValue: settingValue
                    })
                }
            );

            console.log('API Response:', response);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response data:', data);
            return data;

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async updateServerSetting(serverId, settingId, settingKey, settingValue) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/settings/${settingId}?settingKey=${encodeURIComponent(settingKey)}&settingValue=${encodeURIComponent(settingValue)}`, {
                method: 'PUT'
            });
            return await response.json();
        } catch (error) {
            console.error('Sunucu ayarı güncellenirken hata:', error);
            throw error;
        }
    }

    async deleteServerSetting(serverId, settingId) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/settings/${settingId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Sunucu ayarı silinirken hata:', error);
            throw error;
        }
    }

    // Server Roles endpoints
    async getServerRoles(serverId) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/roles`);
            return await response.json();
        } catch (error) {
            console.error('Roller alınırken hata:', error);
            throw error;
        }
    }

    async createServerRole(serverId, roleName) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/roles?roleName=${encodeURIComponent(roleName)}`, {
                method: 'POST'
            });
            return await response.json();
        } catch (error) {
            console.error('Rol oluşturulurken hata:', error);
            throw error;
        }
    }

    async updateServerRole(serverId, roleId, roleName) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/roles/${roleId}?roleName=${encodeURIComponent(roleName)}`, {
                method: 'PUT'
            });
            return await response.json();
        } catch (error) {
            console.error('Rol güncellenirken hata:', error);
            throw error;
        }
    }
    
    async deleteServerRole(serverId, roleId) {
        try {
            const response = await fetch(`${API_URL}/api/servers/${serverId}/roles/${roleId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Rol silinirken hata:', error);
            throw error;
        }
    }

    async createServer({ name, description }) {
        try {
            const payload = {
                name: name,
                description: description
            };

            // CURL komutunu console'a yazdır
            console.log(`curl -X POST ${API_URL}/api/servers \
-H "Content-Type: application/json" \
-d '${JSON.stringify(payload)}'`);

            const response = await fetch(`${API_URL}/api/servers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Sunucu oluşturma hatası: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Sunucu oluşturulurken hata:', error);
            throw error;
        }
    }
}

const api = new Api();