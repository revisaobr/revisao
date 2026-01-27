document.addEventListener('DOMContentLoaded', async () => {
    // 1. Seleção de Elementos
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    const notifList = document.getElementById('notif-list');
    const notifCounter = document.getElementById('notif-counter');

    // Validação de segurança
    if (!notifBtn || !notifDropdown || !notifList || !notifCounter) return;

    // 2. Chaves do LocalStorage
    const KEY_SEEN = 'seenNotifications';   // Notificações que o usuário já clicou na lista
    const KEY_PUSHED = 'pushedNotifications'; // Notificações que já viraram popup (para não repetir)

    // 3. Função para pedir permissão ao navegador
    function requestNotificationPermission() {
        if ("Notification" in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    // Tenta pedir permissão no carregamento
    requestNotificationPermission();

    // 4. Função para enviar o Popup do Navegador
    function sendBrowserNotification(item) {
        if (!("Notification" in window)) return; // Navegador não suporta

        if (Notification.permission === "granted") {
            const notif = new Notification("Nova Notificação", {
                body: item.titulo,
                // Como não temos imagem real no JSON, o navegador usará o ícone padrão.
                // Se quiser ícone customizado, adicione um caminho de imagem (ex: 'logo.png') aqui.
                icon: undefined, 
                tag: item.id // A tag impede que a mesma notificação se empilhe visualmente
            });

            // Ao clicar no popup
            notif.onclick = function() {
                window.focus(); // Traz a janela para frente
                if (item.link && item.link !== 'none') {
                    window.location.href = item.link;
                }
                notif.close();
            };
        }
    }

    // 5. Carregamento dos Dados
    let data;
    try {
        const response = await fetch('notifications.json');
        data = await response.json();
    } catch (err) {
        console.error('Erro ao carregar json:', err);
        return;
    }

    const notifications = data.notifications;

    // Carrega estados salvos
    let seenIds = JSON.parse(localStorage.getItem(KEY_SEEN)) || [];
    let pushedIds = JSON.parse(localStorage.getItem(KEY_PUSHED)) || [];

    // 6. Renderização e Lógica Principal
    function renderNotifications() {
        notifList.innerHTML = '';

        // Filtra apenas as que não foram "vistas" (clicadas na lista)
        const unread = notifications.filter(n => !seenIds.includes(n.id));

        // --- DISPARO DE POPUPS ---
        unread.forEach(item => {
            // Se o item não foi lido E ainda não enviamos popup
            if (!pushedIds.includes(item.id)) {
                sendBrowserNotification(item);
                pushedIds.push(item.id); // Marca como enviado
            }
        });
        // Salva que já enviamos o popup para não enviar de novo ao dar F5
        localStorage.setItem(KEY_PUSHED, JSON.stringify(pushedIds));
        // -------------------------

        // Configura o Contador
        if (unread.length === 0) {
            notifCounter.style.display = 'none';
            notifList.innerHTML = '<div class="notif-empty">Sem notificações novas</div>';
            return;
        }

        notifCounter.textContent = unread.length;
        notifCounter.style.display = 'flex'; // ou 'block', dependendo do seu CSS

        // Cria os elementos na lista
        unread.forEach(item => {
            const el = document.createElement(
                item.link && item.link !== 'none' ? 'a' : 'div'
            );

            if (item.link && item.link !== 'none') {
                el.href = item.link;
            }

            el.className = 'notif-item';
            
            // Renderiza o HTML interno
            el.innerHTML = `
                <i class="ph ${item.icone !== 'none' ? item.icone : 'ph-bell'}"></i>
                <div class="notif-text">
                    <b>${item.titulo}</b>
                    <small>${item.tempo}</small>
                </div>
            `;

            // Clique na notificação da lista (marca como lida)
            el.addEventListener('click', () => {
                if (!seenIds.includes(item.id)) {
                    seenIds.push(item.id);
                    localStorage.setItem(KEY_SEEN, JSON.stringify(seenIds));
                }
                // (Opcional) Removemos visualmente ou apenas atualizamos o contador?
                // Aqui atualizamos tudo:
                renderNotifications();
            });

            notifList.appendChild(el);
        });
    }

    // 7. Eventos do Dropdown
    notifBtn.addEventListener('click', e => {
        e.stopPropagation();
        notifDropdown.classList.toggle('active');
        // Reforça o pedido de permissão caso o usuário tenha ignorado no início
        requestNotificationPermission();
    });

    window.addEventListener('click', () => {
        notifDropdown.classList.remove('active');
    });

    notifDropdown.addEventListener('click', e => e.stopPropagation());

    // Inicializa
    renderNotifications();
});
