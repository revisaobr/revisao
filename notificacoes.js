document.addEventListener('DOMContentLoaded', async () => {
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    const notifList = document.getElementById('notif-list');
    const notifCounter = document.getElementById('notif-counter');

    if (!notifBtn || !notifDropdown || !notifList || !notifCounter) return;

    const STORAGE_KEY = 'seenNotifications';

    let data;

    try {
        const response = await fetch('notifications.json');
        data = await response.json();
    } catch (err) {
        console.error('Erro ao carregar notificações:', err);
        return;
    }

    const notifications = data.notifications;

    // Notificações já vistas
    let seen = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    function renderNotifications() {
        notifList.innerHTML = '';

        const unread = notifications.filter(n => !seen.includes(n.id));

        // Contador
        if (unread.length === 0) {
            notifCounter.style.display = 'none';
            notifList.innerHTML =
                '<div class="notif-empty">Sem notificações</div>';
            return;
        }

        notifCounter.textContent = unread.length;
        notifCounter.style.display = 'flex';

        unread.forEach(item => {
            const el = document.createElement(
                item.link && item.link !== 'none' ? 'a' : 'div'
            );

            if (item.link && item.link !== 'none') {
                el.href = item.link;
            }

            el.className = 'notif-item';
            el.innerHTML = `
                <i class="ph ${item.icone}"></i>
                <div class="notif-text">
                    <b>${item.titulo}</b>
                    <small>${item.tempo}</small>
                </div>
            `;

            el.addEventListener('click', () => {
                if (!seen.includes(item.id)) {
                    seen.push(item.id);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
                }
                renderNotifications();
            });

            notifList.appendChild(el);
        });
    }

    notifBtn.addEventListener('click', e => {
        e.stopPropagation();
        notifDropdown.classList.toggle('active');
    });

    window.addEventListener('click', () => {
        notifDropdown.classList.remove('active');
    });

    notifDropdown.addEventListener('click', e => e.stopPropagation());

    renderNotifications();
});