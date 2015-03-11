define(function(require,exports,module){


    var Surface = require('famous/core/Surface');
    var Modifier = require('famous/core/Modifier');
    var Transform = require('famous/core/Transform');

    var Colors = require('Colors');
    var PSequenceView = require('PositioningLayouts/PSequenceView');
    var BoxView = require('PositioningLayouts/BoxView');
    var ToggleButton = require('Views/ToggleButton');

    function MenuBar(options)
    {
        PSequenceView.call(this,options);

        this.setOpacity(1);
        this.add(new Modifier({transform:Transform.translate(0,0,-1)})).add(new Surface({
            properties:{
                backgroundColor : Colors.get([0,0,0],1)
            }
        }));
    }

    MenuBar.prototype = Object.create(PSequenceView.prototype);
    MenuBar.prototype.constructor = MenuBar;

    MenuBar.DEFAULT_OPTIONS = {
        direction: 0,
        size: [200, 40],
        position:[0,0,5]
    };

    MenuBar.makeMenuButton = function(symbol)
    {
        var containerButton = new BoxView({
            text: symbol, size: [40, 40], clickable: true, color: Colors.EditColor,
            position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 0], fontSize: 'large'
        });
        containerButton.isMenuButton = true;
        return containerButton;
    };

    MenuBar.makeToggleButton = function(symbol)
    {
        var containerButton = new ToggleButton({
            text: symbol, size: [40, 40], clickable: true, color: Colors.EditColor,
            position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 0], fontSize: 'large'
        });
        containerButton.isMenuButton = true;
        return containerButton;
    };


    MenuBar.makeSpacer = function()
    {
        var spacerBox = new BoxView({
            text: "", size: [13, 40], clickable: true, color: Colors.EditColor,
            position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 0], fontSize: 'large',
            style:"hidden"
        });

        return spacerBox;
    };


    module.exports = MenuBar;

});