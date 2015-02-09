define(function(require, exports, module)
{
    var Engine     = require("famous/core/Engine");
    var Surface    = require("famous/core/Surface");
    var Transform  = require("famous/core/Transform");
    var Modifier   = require("famous/core/Modifier");
    var MouseSync  = require("famous/inputs/MouseSync");
    var View = require('famous/core/View');
    var Transitionable = require('famous/transitions/Transitionable');
    var Easing = require('famous/transitions/Easing');
    var PositionableView = require('./PositioningLayouts/PositionableView');

    var MemorySpace = require('./MemObjects/MemorySpace');

    var RectangularPrism = require('./RectangularPrism');

	function MemorySystemView(options)
	{
		View.call(this, options);
        _initView.call(this);
	}

	MemorySystemView.prototype = Object.create(View.prototype);
	MemorySystemView.prototype.constructor = MemorySystemView;

	function _initView()
    {

        var rect = new RectangularPrism({
            size:[40,300,120],
            viewAlign:[0.5,0.5]
        });

        this.add(rect.getModifier()).add(rect);

        for (var angle=20;angle<60;angle +=5)
        {
            var memSpace = new MemorySpace({size:[80,600], position:[-400,0,0],viewOrigin:[0,0.5]});

            memSpace.zRotation = new Modifier({transform:Transform.rotateY(angle*(Math.PI/180))});

            this.add(memSpace.zRotation).add(memSpace.getModifier()).add(memSpace);
        }

    }



	module.exports = MemorySystemView;
});