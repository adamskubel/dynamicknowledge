define(function(require,exports,module){


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

    MenuBar.DEFAULT_OPTIONS = {
        direction: 0,
        size: [true, 40],
        position:[0,0,5],
        viewAlign:[0,0],
        viewOrigin:[0,1]
    };




});