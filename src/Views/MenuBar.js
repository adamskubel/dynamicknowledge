define(function(require,exports,module){


    var Surface = require('famous/core/Surface');
    var Modifier = require('famous/core/Modifier');
    var Transform = require('famous/core/Transform');

    var Colors = require('Colors');
    var PSequenceView = require('PositioningLayouts/PSequenceView');

    function MenuBar(options)
    {
        PSequenceView.call(this,options);

        this.add(new Modifier({transform:Transform.translate(0,0,-1)})).add(new Surface({
            properties:{
                backgroundColor : Colors.get([0,0,0],0.5)
            }
        }));
    }

    MenuBar.prototype = Object.create(PSequenceView.prototype);
    MenuBar.prototype.constructor = MenuBar;

    MenuBar.DEFAULT_OPTIONS = {
        direction: 0,
        size: [200, 40],
        position:[0,0,5],
        viewAlign:[0,0],
        viewOrigin:[0,1]
    };


    module.exports = MenuBar;

});