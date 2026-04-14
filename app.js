document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('user-table-body');
    const sortSelect = document.getElementById('sort-select');
    const headers = document.querySelectorAll('.sortable');

    // --- 1. MISE À JOUR DES STATS ---
    const updateStats = () => {
        const countGreen = document.querySelectorAll('.row-green').length;
        const countYellow = document.querySelectorAll('.row-yellow').length;
        const countRed = document.querySelectorAll('.row-red').length;

        if(document.getElementById('count-green')) document.getElementById('count-green').innerText = countGreen;
        if(document.getElementById('count-yellow')) document.getElementById('count-yellow').innerText = countYellow;
        if(document.getElementById('count-red')) document.getElementById('count-red').innerText = countRed;
    };

    // --- 2. FONCTION DE TRI UNIVERSELLE ---
    function executerTri(critere) {
        const rows = Array.from(tableBody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            let aCol, bCol;
            switch(critere) {
                case 'nom': aCol = a.cells[2]; bCol = b.cells[2]; break;
                case 'ville': aCol = a.cells[4]; bCol = b.cells[4]; break;
                case 'anciennete': aCol = a.cells[5]; bCol = b.cells[5]; break;
                case 'licence': aCol = a.cells[6]; bCol = b.cells[6]; break;
                case 'statut': 
                    const p = { 'row-red': 1, 'row-yellow': 2, 'row-green': 3 };
                    // On compare les noms de classe pour le tri par signal
                    const classA = a.className.split(' ').find(c => c.startsWith('row-'));
                    const classB = b.className.split(' ').find(c => c.startsWith('row-'));
                    return p[classA] - p[classB];
                default: return 0;
            }

            let valA = aCol ? aCol.innerText.toLowerCase() : "";
            let valB = bCol ? bCol.innerText.toLowerCase() : "";

            if (critere === 'anciennete') {
                return parseInt(valB) - parseInt(valA); // Tri numérique décroissant
            }
            return valA.localeCompare(valB); // Tri alphabétique
        });

        // Mise à jour du DOM
        tableBody.innerHTML = "";
        rows.forEach(row => tableBody.appendChild(row));
    }

    // --- 3. CHARGEMENT DES DONNÉES DEPUIS LE SERVEUR ---
    async function chargerUtilisateurs() {
        try {
            const response = await fetch('/api/users');
            const utilisateurs = await response.json();
            
            tableBody.innerHTML = ""; // On vide les exemples statiques

            utilisateurs.forEach(user => {
                const row = document.createElement('tr');
                // On applique la classe row-vert/orange/rouge reçue du serveur
                row.className = `row-${user.statut.toLowerCase()}`; 
                
                row.innerHTML = `
                    <td><span class="dot"></span></td>
                    <td>
                        <label class="switch-admin">
                            <input type="checkbox" checked>
                            <span class="slider-retro round"></span>
                        </label>
                    </td>
                    <td>${user.nom}</td>
                    <td>${user.email}</td>
                    <td>AFEC France</td>
                    <td>À calculer</td>
                    <td>${user.message}</td>
                `;
                tableBody.appendChild(row);
            });
            
            updateStats(); // Mise à jour des bulles de stats après chargement
            
        } catch (err) {
            console.error("Impossible de charger les données Microsoft", err);
        }
    }

    // --- 4. ÉVÉNEMENTS (TRI) ---

    // Menu déroulant
    if(sortSelect) {
        sortSelect.addEventListener('change', (e) => executerTri(e.target.value));
    }

    // Clic sur les titres de colonnes
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const critere = header.getAttribute('data-critere');
            if (critere) {
                executerTri(critere);
                if(sortSelect) sortSelect.value = critere; // Synchronise le menu
            }
        });
    });

    // --- Lancement initial ---
    chargerUtilisateurs();
});