document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleção de Elementos
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    const notifList = document.getElementById('notif-list');
    const notifCounter = document.getElementById('notif-counter');

    // Validação de segurança
    if (!notifBtn || !notifDropdown || !notifList || !notifCounter) return;

    // 2. Chaves do LocalStorage
    const KEY_HISTORY = 'my_onesignal_history'; // Onde salvaremos o histórico de notificações
    const KEY_SEEN = 'seenNotifications';       // Notificações que o usuário já clicou/abriu no dropdown

    // Carrega dados salvos no navegador
    let notificationHistory = JSON.parse(localStorage.getItem(KEY_HISTORY)) || [];
    let seenIds = JSON.parse(localStorage.getItem(KEY_SEEN)) || [];

    // 3. Função de Renderização (Atualiza o Dropdown)
    function renderNotifications() {
        notifList.innerHTML = '';

        // Filtra para saber quantas não foram lidas (para o contador)
        const unreadCount = notificationHistory.filter(n => !seenIds.includes(n.id)).length;

        // Configura o Contador
        if (unreadCount === 0) {
            notifCounter.style.display = 'none';
        } else {
            notifCounter.textContent = unreadCount;
            notifCounter.style.display = 'flex';
        }

        // Se não houver histórico
        if (notificationHistory.length === 0) {
            notifList.innerHTML = '<div class="notif-empty" style="padding:15px; text-align:center; color:#888;">Sem notificações novas</div>';
            return;
        }

        // Cria os elementos na lista (Do mais recente para o mais antigo)
        // Usamos .slice(0, 10) para mostrar apenas as últimas 10, por exemplo
        notificationHistory.slice(0, 10).forEach(item => {
            const el = document.createElement(item.link ? 'a' : 'div');
            
            if (item.link) {
                el.href = item.link;
                el.target = "_blank"; // Opcional: abrir em nova aba
            }

            el.className = 'notif-item';
            // Adiciona classe de "lido" visualmente se quiser estilizar diferente
            if (seenIds.includes(item.id)) el.classList.add('read');

            el.innerHTML = `
                <i class="ph ph-bell"></i>
                <div class="notif-text">
                    <b>${item.titulo}</b>
                    <small>${item.tempo}</small>
                </div>
            `;

            // Clique na notificação da lista
            el.addEventListener('click', () => {
                if (!seenIds.includes(item.id)) {
                    seenIds.push(item.id);
                    localStorage.setItem(KEY_SEEN, JSON.stringify(seenIds));
                    renderNotifications(); // Atualiza o contador
                }
            });

            notifList.appendChild(el);
        });
    }

    // 4. Integração com OneSignal
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    OneSignalDeferred.push(function(OneSignal) {
        
        // Listener: Quando uma notificação chega enquanto o usuário está no site
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', function(event) {
            // O OneSignal vai mostrar o Popup nativo automaticamente.
            // Aqui nós capturamos os dados para salvar na NOSSA lista HTML.
            
            const notif = event.getNotification();
            
            const newNotification = {
                id: notif.notificationId, // ID único do OneSignal
                titulo: notif.title || "Nova Mensagem",
                // O corpo da mensagem pode ir aqui se quiser exibir
                body: notif.body, 
                tempo: new Date().toLocaleString('pt-BR'), // Pega a hora atual
                link: notif.launchURL || notif.additionalData?.link || null
            };

            // Adiciona no início da lista (unshift)
            notificationHistory.unshift(newNotification);
            
            // Salva no LocalStorage
            localStorage.setItem(KEY_HISTORY, JSON.stringify(notificationHistory));

            // Atualiza a tela
            renderNotifications();
        });

        // Configuração do Botão de Sininho para pedir permissão se ainda não tiver
        notifBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            // Abre/Fecha o dropdown
            notifDropdown.classList.toggle('active');

            // Verifica se tem permissão, se não tiver, pede
            // (Isso substitui o requestPermission nativo)
            if (OneSignal.Notifications.permission === false || OneSignal.Notifications.permission === "default") {
                console.log("Pedindo permissão ao OneSignal...");
                await OneSignal.Notifications.requestPermission();
            }
        });
    });

    // 5. Eventos de UI (Fechar dropdown ao clicar fora)
    window.addEventListener('click', () => {
        notifDropdown.classList.remove('active');
    });

    notifDropdown.addEventListener('click', e => e.stopPropagation());

    // Inicialização
    renderNotifications();
});
