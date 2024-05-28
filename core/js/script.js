(function(window, $)
{
    /**
     * Objet global
     */
    let me = { };
    
    
    /**
     * Charger les données
     */
    function init_data()
    {
        me.data = { };
        
        $.getJSON('./core/json/data.json', function(result) {
            me.data.json = result;
            init_view();
        });
    }


    /**
     * Retourne les données d'un projet en fonction d'un id
     */
    function get_project_data(id)
    {
        for (let i = 0; i < me.data.json.projects.length; i++) {
            const data = me.data.json.projects[i];
            if (data.id === id) {
                return data;
            }
        }

        return null;
    }


    /**
     * Construire la vue
     */
    function init_view()
    {
        me.view = { };

        me.view.z_index = 0;

        me.view.boxes = [ ];

        // TODO PENSER A AJOUTER UNE DIV OU CLASS
        // POUR LE DESKTOP ET POUR LE DOCK POUR LES DIFFERENCIER DANS LE CSS
        // (séparer en plusieurs foonction);
        projects_view('desktop');
        projects_view('dock');

        // Écouter le clic sur les icones
        $('.project').on('click', function(event) {
            const id = $(this).data('id');
            open_window(id);
        });
    }


    /**
     * Initialisation des icône sur desktop et dock
     */
    function projects_view(project_class)
    {
        const view_project = $(`<div class="${project_class}"><ul class="projects"></ul></div>`).appendTo('body');
        
        $.each(me.data.json.projects, function(index, element)
        {
            $(`.${project_class} .projects`).append(`
                <li
                    class="project has-background-primary p-5 id-${element.id}"
                    style="background-image: url('${element.poster}');"
                    data-id="${element.id}">
                    <p class="project-title">${element.name}</p>
                </li>
            `);

            me.view.boxes.push({
                id: element.id,
                x: 350,
                y: 200,
                w: 900,
                h: 600,
                fullscreen: false,
                minimize: false
            });
        });
        
        return;
    }


    /**
     * Initialisation d'une fenêtre
     */
    function window_view(id)
    {
        // Récupère les données
        const data = get_project_data(id);
        
        const win = $(`
            <div class="box" id="box-${id}" data-id="${id}">
                <div class="titlebar">
                    <div class="buttons">
                        <div class="close">
                            <div class="closebutton">
                                <span>
                                    <p>x</p>
                                </span>
                            </div>
                        </div>
                        <div class="minimize">
                            <div class="minimizebutton">
                                <span>
                                    <p>&ndash;</p>
                                </span>
                            </div>
                        </div>
                        <div class="fullscreen">
                            <div class="fullscreenbutton">
                                <span>
                                    <p>+</p>
                                </span>
                            </div>
                        </div>
                    </div>
                    <p>${data.name}.txt</p>
                </div>
                <div class="content">
                    <h3>${data.name}</h3>
                    ${data.desc}
                </div>
            </div>
        `).appendTo('body');
        return win;
    }


    /**
     * Ouvrir une fenêtre ciblée par son id
     */
    function open_window(id)
    {
        // Si la fenêtre est déjà ouverte on ne fait rien
        const box = $('#box-' + id);
        if (box.length === 1 || box.css('opacity') === 0) {
            box.css({
                'z-index': ++me.view.z_index,
                'opacity': 1,
                'transform': 'translate(0px,0px)'
            });

            return;
        }

        const win = window_view(id);

        // Marquer les fenêtre déjà ouverte
        $('.dock .id-' + id + '.project' ).append("<p class='isopen'> ● </p>");

        const box_data = me.view.boxes.find((element) => element.id === id);

        // Assigner les données du tableau a la fenêtre
        win.css({
            'z-index': ++me.view.z_index,
            'left': box_data.x,
            'top': box_data.y
        });
 
        // Écouter le clique sur la croix
        win.find('.closebutton').on('click', function(event) {
            close_box(id);
        });

        // Écouter le clique sur le full screen
        win.find('.fullscreenbutton').on('click', function(event) {
            full_screen(id);
        });

        // Écouter le clique sur le minimize screen
        win.find('.minimizebutton').on('click', function(event) {
            minimize_box(id);
        });

        win.find('.convertbutton').on('click',function(event){
            add_img(id);
        });

        $('.box').on('mousedown', move_front);

        $('.box .titlebar').on('mousedown', start_drag);
        // TODO : RESIZE LA PAGE 
    }


    /**
     * Fermer une fenêtre ciblée par son id
     */
    function close_box(id)
    {
        $('.dock .id-' + id + '.project .isopen' ).remove();
        const win = $('#box-' + id);
        win.remove();
    }


    /**
     * Mettre la fenêtre en pleine écran
     */
    function full_screen(id)
    {
        const win = $('#box-' + id);
        
        const box_data = me.view.boxes.find((element) => element.id === id);

        if(box_data.fullscreen === false){
            //sauvegarder emplacement de la fenêtre
            
            box_data.x=win.css('left');
            box_data.y=win.css('top');
            box_data.w = win.css('width');
            box_data.h = win.css('height');

            win.css({
                'left': 0,
                'top': 0,
                'width' : 100 + '%',
                'height' : 100 + '%'
            });
            box_data.fullscreen = true;
            return;
        }

        win.css({
            'left': box_data.x,
            'top': box_data.y,
            'width' : box_data.w,
            'height' : box_data.h
        });
        box_data.fullscreen = false;
    }

    /**
     * Minimiser une fenêtre
     */
    function minimize_box(id)
    {
        const win = $('#box-' + id);
        win.css({
            'opacity' : 0,
            'transform' : 'translate(0%,200%)',
            'transition-property' : 'opacity , transform',
            'transition-duration' : 1000 +'ms',
            'transition-timing-function' : 'ease-in-out',
        });
        
        return;
    }


    /**
     * 
     */
    function add_img(id)
    {
        const win = $('#box-' + id + ' .img_convert');
        win.css({
            'opacity' : 1,
            'transition-property' : 'opacity ',
            'transition-duration' : 500 +'ms',
            'transition-timing-function' : 'ease-in-out',});
    }


    /**
     * Déplacer une box en premier plan
     */
    function move_front(event)
    {
        // Cibler l'élément à partir de son id
        const box = $('#' + $(this).attr('id'));
        if(parseInt(box.css('z-index')) === parseInt(me.view.z_index)){
            return;
        }
        // Mettre à jour le z-index de l'élément
        // pour qu'il passe devant les autres
        box.css('z-index', ++me.view.z_index);
    }
    

    /**
     * Commencer le drag de la fenêtre
     */
    function start_drag(event) 
    {
        // Réinitialiser a l'état initial
        stop_drag();

        // Cibler l'élément a déplace
        me.dragged = $(this).parent();

        // Vérifier si la fenêtre est en pleine écran
        const box_data = me.view.boxes.find((element) => element.id === me.dragged.data('id'));
        if(box_data.fullscreen === true ){
            return;
        }
        // Ajouter une classe pendant qu'il se déplace
        me.dragged.addClass('dragged');

        // Calculer le décalage global à appliquer pendant le drag
        // = coordonnées actuelles de la souris - position actuelle de l'élément
        const offset = me.dragged.offset();
        me.offset_x = event.clientX - offset.left;
        me.offset_y = event.clientY - offset.top;

        // call a function whenever the cursor moves:
        $(window)
            .on('mousemove', do_drag)
            .on('mouseup', stop_drag);
    }


    /**
     * Pendant le drag
     */
    function do_drag(event) 
    {   
        const new_x = event.clientX - me.offset_x;
        const new_y = event.clientY - me.offset_y;

        me.dragged.css({
            left: new_x + 'px',
            top: new_y + 'px'
        });
    }


    /**
     * Termine le drag
     */
    function stop_drag(event)
    {
        // Si un objet était en cours de drag
        // sauvegarder sa dernière position
        if (me.dragged) {
            const offset = me.dragged.offset();
            for (let i = 0, iMax = me.view.boxes.length; i < iMax; i++) {
                if (parseInt(me.view.boxes[i].id) === parseInt(me.dragged.data('id')) && me.view.boxes[i].fullscreen === false) {
                    me.view.boxes[i].x = offset.left;
                    me.view.boxes[i].y = offset.top;
                    break;
                }
            }
        }

        me.dragged = null;
        $('.box').removeClass('dragged');

        $(window)
            .off('mousemove',do_drag)
            .off('mouseup',stop_drag);
    }


    /**
     * On dom ready
     */
    window.onload = function()
    {
        init_data();
    }

})(window, jQuery);
