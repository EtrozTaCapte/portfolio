(function(window, $, T)
{
    /**
     * Objet global
     */
    let me = { };

    /**
     * Initialisation
     */
    function init()
    {   
        me.view = {
            game: $('#game')
        };

        me.view.game.append(`
            <div class ="sky">
                <img class="boat" src="./core/img/bateau.svg" alt="bateau"></img>
                <canvas id="canvas" class="fil" width="1000px" height="750px" ></canvas>
            </div>
        `);
        
        me.view.game.on('mousemove', followmouse);

        me.view.game.on('click', function(){
        });

        me.view.boat = $('.boat');
        me.data = {
            time: 1,
            size: me.view.game.css('width'),
            min_x: 0,
            max_x: me.view.game.width() - me.view.boat.width(),
            max_y: me.view.game.height(),
            spawn_time: 2000,
            is_fishing: true,
            last_fish_id: 0,
            nb_fish: 0,
            deleted_fish: 0,
            timer_sec: 0,
            timer_min: 0,
            fish_prob: 80,
            shark_prob: 10,
            goldfish_prob:10
        };

        $('body').on('keydown', function(event){
            moveboat(event);
        });

        me.fil = document.getElementById('canvas').getContext('2d');
        //Lancer la fonction de spawn des poisson avec une intervale
        intervale = setInterval(fish_spawner,me.data.spawn_time);
        //Initialisation du Timer de pêche
        timer = 0;
        timer_intervale = setInterval(timer_game,1000);
        
    }

    /**
     * suivre la souris
     */
    function followmouse(event)
    {
        const offset = me.view.game.offset();
        me.offset_x = event.clientX - offset.left;//PROBLEME DE POS HAMECON SUREMENT ICI
        me.offset_y = event.clientY - offset.top;
        let boat_x = parseInt(me.view.boat.css('left'));
        movefil(boat_x);
    }


    /**
     * Bouger le fil
     */
    function movefil(pos_boat)
    {
        $('canvas').css({
            'width' : me.view.game.width(),
            'height' : me.view.game.height()
        });
        $('canvas').attr("width",me.view.game.width());
        $('canvas').attr("height",me.view.game.height());
        souris_pos = me.offset_x + me.offset_y
        pos_boat = parseInt(pos_boat);
        if(!(me.offset_x>pos_boat-me.view.boat.width() && me.offset_x<pos_boat+me.view.boat.width()*2)){
            me.fil.reset();
            me.fil.stroke();
            me.data.is_fishing = false;
            unfishing_fish();
            return;
        }
        me.fil.reset();
        me.fil.moveTo(pos_boat+70,80);
        me.fil.lineTo(me.offset_x, me.offset_y);
        me.fil.stroke();
        me.data.is_fishing = true;
    }

    /**
     * Lorsque le tween commence
     */
    function onTweenStart()
    {
        console.log('start');
    }

    
    /**
     * À chaque tick d'update du tween
     */
    function onTweenUpdate()
    {
        movefil(me.view.boat.css('left'));
    }


    /**
     * Lorsque le tween est terminé
     */
    function onTweenComplete()
    {
        console.log('complete');
    }


    /**
     * Bouger le bateau
     */
    function moveboat(e)
    {
        //Écouter les touhes et leur assigner une valeur
        switch(e.code)
        {
            case 'ArrowRight':
            case 'KeyD':
                me.data.direction = 1;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                me.data.direction = -1;
                break;

            default:
                return;
        }

        // Supprimer le déplacement précédent
        T.killTweensOf(me.view.boat);

        // Orienter le bateau dans la bonne direction
        me.view.boat.css('transform', 'scaleX(' + me.data.direction + ')');

        // Lire la position actuelle du bateau
        // et annuler les déplacements inutiles
        me.data.max_x= me.view.game.width();
        const boat_x = me.view.boat.offset().left - me.view.game.offset().left;
        if (
            (boat_x === me.data.min_x && me.data.direction === -1) ||
            (boat_x === me.data.max_x && me.data.direction === 1)
        ) {
            return;
        }

        // Calculer la nouvelle position à atteindre
        // = position actuelle + distance à parcourir dans cette direction
        // on ne veut pas que la bateau sorte de la zone du jeu
        let new_x = boat_x + parseInt(me.data.size)/5 * me.data.direction;
        if (new_x < me.data.min_x) {
            new_x = me.data.min_x;
            movefil(new_x);
        } else if (new_x > me.data.max_x-me.view.boat.width()) {
            new_x = me.data.max_x-me.view.boat.width();
            movefil(new_x);
        }

        // Lancer le nouveau déplacement
        T.to(me.view.boat, {
            left: new_x,
            duration: me.data.time,
            onStart: onTweenStart,
            onUpdate: onTweenUpdate,
            onComplete: onTweenComplete
        });

    }

    /**
     * Retourne un nombre aléatoire entre les paramètres min et max
     */
    function getRandomInt(min ,max) {
        let randint = Math.floor(Math.random() * max);
        if(randint<min)
            randint = getRandomInt(min,max);
            return randint;

    }

    /**
     * Renvoie la position en y de l'apparition des poissons
     * Le delay entre chaque position diminue a chaque fois
     * Jusqu'à un certain seuil
     */
    function fish_spawner()
    {
        clearInterval(intervale);
        me.data.max_y = me.view.game.height();
        let rand_fish = getRandomInt(100,me.data.max_y);
        if(me.data.spawn_time<1000){
            create_fish(rand_fish);
            intervale = setInterval(fish_spawner,me.data.spawn_time);
            return;
        }
        
        if(me.data.spawn_time<1500){
            me.data.spawn_time*=0.95;
        }

        if(me.data.spawn_time>1500){
            me.data.spawn_time*=0.80;
        }
        create_fish(rand_fish);
        intervale = setInterval(fish_spawner,me.data.spawn_time);
        return;
    }

    /**
     * Créer un poisson/goldenfish/requin
     */
    function create_fish(pos_y)
    {
        if(me.data.nb_fish>=10){
            return
        }
        new_spawn = prob_spawn();
        me.data.nb_fish++;
        me.data.last_fish_id++;
        me.view.game.append(`
            <img src ="./core/img/` + new_spawn + `.png" class=` + new_spawn + ` style="top: ` + pos_y + `px" id=` + me.data.last_fish_id + ` /> 
        `)
        $('.fish').on("mouseenter",function(event){
            fishing_fish(event,2000);
        });
        
        $('.fish').on("mouseleave",function(){
            unfishing_fish();
        });

        $('.goldenfish').on("mouseenter",function(event){
            fishing_fish(event,2500);
        });

        $('.goldenfish').on("mouseleave",function(){
            unfishing_fish();
        });

    }

    /**
     * Pêcher un poisson si le bateau n'est pas trop loin
     */
    function fishing_fish(event,fishing_time)
    {
        if(me.data.is_fishing === false){
            return;
        }
        clearTimeout(timer);
        timer = setTimeout(function(){remove_fish(event.target.id)}, fishing_time);
    }
    
    /**
     * nettoie le timer `timer`
     */
    function unfishing_fish()
    {
        clearTimeout(timer);
    }

    /**
     * Retirer le poisson
     */
    function remove_fish(id)
    {
        nb_point = 1;
        if($('#' + id).attr('class') == 'goldenfish'){
            nb_point = 3;
        }
        $('#' + id).remove();
        if($('#'+id).lenght){
            return;
        }
        
        me.data.nb_fish = me.data.nb_fish - 1;
        me.data.deleted_fish += nb_point;
        $('.score').text("score : " + me.data.deleted_fish);
        
    }

    /**
     * Met a jour le temps de jeu
     */
    function timer_game()
    {
        if(me.data.timer_sec == 59){
            me.data.timer_sec = 0;
            me.data.timer_min = me.data.timer_min + 1;
        }
        else{
            me.data.timer_sec = me.data.timer_sec + 1;
        }
        temp_min = me.data.timer_min;
        temp_sec = me.data.timer_sec;
        if(me.data.timer_min<10){
            temp_min = '0'+me.data.timer_min;
        }
        if(me.data.timer_sec<10){
            temp_sec = '0'+me.data.timer_sec;
        }
        $('.timer').text(temp_min + ":" + temp_sec);
    }
    /**
     * 
     */
    function prob_spawn()
    {
        randint = Math.random()*100;
        console.log(randint);
        if(randint<me.data.fish_prob){
            return "fish"; 
        }
        if(me.data.fish_prob < randint && randint < me.data.fish_prob+me.data.shark_prob){
            return "shark";
        }
        if(me.data.fish_prob+me.data.shark_prob<randint){
            return "goldenfish";
        }
    }

    /**
     * On dom ready
     */
    // window.onload = function()
    // {
        init();
        
    //}

})(window, jQuery, gsap);
