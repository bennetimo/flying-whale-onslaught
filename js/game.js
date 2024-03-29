(function() {
    //
    // Components
    //

    // a renderable entity
    Crafty.c('Renderable', {
        init: function() {
            // we're using DOM Spirtes
            this.requires('2D, DOM');
        },
        // set which sprite to use -- should match up with a call to Crafty.sprite()
        spriteName: function(name) {
            this.requires(name);
            return this; // so we can chain calls to setup functions
        } 
    });

    // a component to fade out an entity over time
    Crafty.c('FadeOut', {
        init: function() {
            this.requires('2D');

            // the EnterFrame event is very useful for per-frame updates!
            this.bind("EnterFrame", function() {
                this.alpha = Math.max(this._alpha - this._fadeSpeed, 0.0);
                if (this.alpha < 0.05) {
                    this.trigger('Faded');
                    // its practically invisible at this point, remove the object
                    this.destroy();
                }
            });
        },
        // set the speed of fading out - should be a small number e.g. 0.01
        fadeOut: function(speed) {
            // reminder: be careful to avoid name clashes...
            this._fadeSpeed = speed;
            return this; // so we can chain calls to setup functions
        }
    });

    // rotate an entity continually
    Crafty.c('Rotate', {
        init: function() {
            this.requires('2D');

            // update rotation each frame
            this.bind("EnterFrame", function() {
                this.rotation = this._rotation + this._rotationSpeed;
            });
        },
        // set speed of rotation in degrees per frame
        rotate: function(speed) { 
            // rotate about the center of the entity               
            this.origin('center');
            this._rotationSpeed = speed;
            return this; // so we can chain calls to setup functions
        },
    });

    // an exciting explosion!
    Crafty.c('Explosion', {
        init: function() {
            // reuse some helpful components
            this.requires('Renderable, FadeOut')
                .spriteName('explosion' + Crafty.math.randomInt(1,2))
                .fadeOut(0.1);
        }
    });

    // a bullet, it shoots things
    Crafty.c('Bullet', {
        init: function() {
            this.requires('Renderable, Collision, Delay, SpriteAnimation')
                .spriteName('bubble')
                .collision()
                // set up animation from column 0, row 1 to column 1
                .animate('fly', 0, 0, 1)
                // start the animation
                .animate('fly', 5, -1)                
                // move left every frame, destroy bullet if its off the screen
                .bind("EnterFrame", function() {
                    this.x += 10;
                    if (this.x > 1024) {
                        this.destroy();
                    }
                })
        }
    });

    
    // targets to shoot at
    Crafty.c('Target', {
        init: function() {
            this.requires('Renderable, Collision, Delay')
                // choose a random enemy sprite to use
                .spriteName('enemy' + Crafty.math.randomInt(1,2))
                .collision()
                // detect when we get hit by bullets
                .onHit('Bullet', this._hitByBullet);
            // choose a random position
            this._randomlyPosition();            
        },
        // randomly position 
        _randomlyPosition: function() {
            this.attr({
                x: Crafty.math.randomNumber(500, 800), 
                y: Crafty.math.randomNumber(0,600-this.h)});
        },
        // we got hit!
        _hitByBullet: function() {
            // find the global 'Score' component
            var score = Crafty('Score');
            score.increment();

            // show an explosion!
            Crafty.e("Explosion").attr({x:this.x, y:this.y});

            // hide this offscreen
            this.x = -2000;

            // reappear after a second in a new position
            this.delay(this._randomlyPosition, 1000);
        },

       
    });

// targets to shoot at
    Crafty.c('Whale', {
        init: function() {
            this.requires('Renderable, Collision, Delay, SpriteAnimation, ViewportBounded')
                // choose a random enemy sprite to use
                .spriteName('whale')
                .collision()
                .animate('swim', 0, 0, 1)
                .animate('swim', 5, -1)
                // detect when we get hit by bullets
                .onHit('Bullet', this._hitByBullet);

            // choose a random position
            this._randomlyPosition();   

            this.bind('EnterFrame', function(oldPosition) {
                this.x -= this.dX;
               if(!this.within(0, 0, Crafty.viewport.width, Crafty.viewport.height)) {
                var score = Crafty('Score');
               score.decrement();
               //this.delay(score.decrement(), 3000);

                this.destroy();
                var newEnemies = Crafty.math.randomInt(0,2);
                
                for (i = 0; i < newEnemies; i++) {
                    var time = Crafty.math.randomInt(1000,5000)
                    this.delay(Crafty.e('Whale'), time);
                }
            }
            });    
        },


        // randomly position 
        _randomlyPosition: function() {
            this.attr({
                x: 900, 
                y: Crafty.math.randomNumber(0,600-this.h), 
            dX: Crafty.math.randomInt(2, 8), 
            dY: Crafty.math.randomInt(2, 5)});
        },
        // we got hit!
        _hitByBullet: function() {
            // find the global 'Score' component
            var score = Crafty('Score');
            score.increment();

            // show an explosion!
            Crafty.e("Explosion").attr({x:this.x, y:this.y});

            // hide this offscreen
            this.x = -2000;

            // reappear after a second in a new position
            this.delay(this._randomlyPosition, 1000);
        },
    });

    // Limit movement to within the viewport
    Crafty.c('ViewportBounded', {
        init: function() {
            this.requires('2D');
        },
        // this must be called when the element is moved event callback
        checkOutOfBounds: function(oldPosition) {
            if(!this.within(0, 0, Crafty.viewport.width, Crafty.viewport.height)) {
                this.attr({x: oldPosition.x, y: oldPosition.y});
            }
        }
    });

    // Player component    
    Crafty.c('Player', {        
        init: function() {           
            this.requires('Renderable, Fourway, Collision, ViewportBounded, SpriteAnimation')
                .spriteName('swimmer')
                .collision()
                .attr({x: 64, y: 64})
                // animate the ship - set up animation, then trigger it
                .animate('swim', 0, 0, 1)
                .animate('swim', 18, -1)
                .onHit('Whale', this._hitByWhale)
                // set up fourway controller
                .fourway(5)
                // also react to the SPACE key being pressed
                .requires('Keyboard')
                .bind('KeyDown', function(e) {
                    if (e.key === Crafty.keys.SPACE) {
                        // fire bullet
                        Crafty.e("Bullet").attr({x: this.x + 5, y: this.y});
                    }
                });

            // bind our movement handler to keep us within the Viewport
            this.bind('Moved', function(oldPosition) {
                this.checkOutOfBounds(oldPosition);
            });

            this.bind("EnterFrame", function() {
                if (Crafty.frame() % 100 == 0){
                   Crafty.e('Whale');
                }
            });
        },
        // we got hit!
        _hitByWhale: function() {
            // show an explosion!
            Crafty.e("Explosion").attr({x:this.x, y:this.y});
            var score = Crafty('Score');
            score.decrement();
            //Crafty.scene('gameover');
        },
    });

    // A component to display the player's score
    Crafty.c('Score', {
        init: function() {
            this.score = 0;
            this.requires('2D, DOM, Text');
            this._textGen = function() {
                return "Score: " + this.score;
            };
            this.attr({w: 100, h: 20, x: 900, y: 0})
                .text(this._textGen);
        },
        // increment the score - note how we call this.text() to change the text!
        increment: function() {
            this.score = this.score + 2;
            this.text(this._textGen);
        },
        decrement: function() {
            this.score = this.score - 1;
            this.text(this._textGen);
            if(this.score < 0) {
               Crafty.scene('gameover')
            }
        }
    })


    //
    // Game loading and initialisation
    //    
    var Game = function() {
        Crafty.scene('loading', this.loadingScene);
        Crafty.scene('main', this.mainScene);
        Crafty.scene('gameover', this.gameOverScene);

    };
    
    Game.prototype.initCrafty = function() {
        console.log("page ready, starting CraftyJS");
        Crafty.init(1000, 600);
        Crafty.canvas.init();
        Crafty.background('rgb(180,235,253)');
        
        Crafty.modules({ 'crafty-debug-bar': 'release' }, function () {
            if (Crafty.debugBar) {
               Crafty.debugBar.show();
            }
        });
    };
    
    // A loading scene -- pull in all the slow things here and create sprites
    Game.prototype.loadingScene = function() {
        var loading = Crafty.e('2D, Canvas, Text, Delay');
        loading.attr({x: 512, y: 200, w: 100, h: 20});
        loading.text('loading...');
        
        function onLoaded() {
            // set up sprites
            Crafty.sprite(64, 'img/shooter-sprites.png', {
                player: [0, 0],
                bullet: [0, 1],
                enemy1: [0, 2],
                enemy2: [1, 2],
                explosion1: [0, 3],
                explosion2: [1, 3]
                });

            Crafty.sprite(64, 'img/whale_blue.png', {
                whale: [0,0]
            });

            Crafty.sprite(64, 'img/swimmer.png', {
                swimmer: [0,0]
            });

            Crafty.sprite(64, 'img/bubbles.png', {
                bubble: [0,0]
            });

            
            // jump to the main scene in half a second
            loading.delay(function() {
                Crafty.scene('main');
            }, 500);
        }
        
        function onProgress(progress) {
            loading.text('loading... ' + progress.percent + '% complete');
        }
        
        function onError() {
            loading.text('could not load assets');
        }
        
        Crafty.load([
            // list of images to load
            'img/shooter-sprites.png'
        ], 
        onLoaded, onProgress, onError);
        
    };

    // A loading scene -- pull in all the slow things here and create sprites
    Game.prototype.gameOverScene = function() {
        var score = Crafty('Score');

        var gameover = Crafty.e('2D, Canvas, Text, Delay');
        gameover.attr({x: 512, y: 200, w: 100, h: 20});
        gameover.text('Game Over!');
    };
    
    //
    // The main game scene
    //
    Game.prototype.mainScene = function() {
        // create a scoreboard
        Crafty.e('Score');

        //create a player...
        Crafty.e('Player');

        for (i = 0; i < 5; i++) {
            Crafty.e('Whale');
        }

    };
    
    // kick off the game when the web page is ready
    $(document).ready(function() {
        var game = new Game();
        game.initCrafty();
        
        // start loading things
        Crafty.scene('loading');
    });
    
})();