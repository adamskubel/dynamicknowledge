define(function(require,exports,module){

    var PositionableView = require('PositioningLayouts/PositionableView');
    var Vector = require('ProperVector');
    var Surface    = require("famous/core/Surface");
    var Colors = require('Colors');

    function ConnectingLineAnchor(options)
    {
        PositionableView.call(this, options);

        var surfaceProps = {
            backgroundColor : Colors.HoloBlue(0.5),
            borderStyle : 'solid',
            color : Colors.HoloBlue(0.8)
        };

        this.add(new Surface({size:[undefined,undefined],properties:surfaceProps}));
    }

    ConnectingLineAnchor.DEFAULT_OPTIONS = {
        viewOrigin:[0.5,0.5],
        size: [10,10]
    };

    ConnectingLineAnchor.prototype = Object.create(PositionableView.prototype);
    ConnectingLineAnchor.prototype.constructor = ConnectingLineAnchor;
    module.exports = ConnectingLineAnchor;


    ConnectingLineAnchor.prototype.getNormal = function()
    {
        var alignVector = Vector.fromArray(this.viewAlign);

        return alignVector.sub(new Vector(0.5,0.5,0)).unit();
    };

});