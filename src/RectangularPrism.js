define(function(require, exports, module)
{
    var Engine     = require("famous/core/Engine");
    var Surface    = require("famous/core/Surface");
    var PositionableView = require('./PositioningLayouts/PositionableView');
    var ObjectFactory = require('./ObjectFactory');
    var Transform = require("famous/core/Transform");
    var Modifier = require('famous/core/Modifier');
    var Vector = require('./ProperVector');

    function RectangularPrism(options)
    {
        PositionableView.call(this,options);

        _makePrism.call(this,this.options.size);
    }

    RectangularPrism.prototype = Object.create(PositionableView.prototype);
    RectangularPrism.prototype.constructor = RectangularPrism;


    function _makePrism(_size)
    {
        var surfaces = [];

        var size = Vector.fromArray(_size);

        for (var i=0;i<6;i++)
        {
            surfaces[i] = (new ObjectFactory()).makeSurface('');
        }

        var node = this.add(new Modifier({align:[0.5,0.5], origin:[0.5,0.5]}));

        //left
        node.add(new Modifier({
            transform:Transform.thenMove(Transform.rotateY(Math.PI/2),[size.x*0.5,0,0]),
            size:[size.z,size.y]
        })).add(surfaces[0]);

        //right
        node.add(new Modifier({
            transform:Transform.thenMove(Transform.rotateY(Math.PI/2),[size.x*-0.5,0,0]),
            size:[size.z,size.y]
        })).add(surfaces[1]);

        //top
        node.add(new Modifier({
            transform:Transform.thenMove(Transform.rotateX(Math.PI/2),[0,size.y*-0.5,0]),
            size:[size.x,size.z]
        })).add(surfaces[2]);

        //bottom
        node.add(new Modifier({
            transform:Transform.thenMove(Transform.rotateX(Math.PI/2),[0,size.y*0.5,0]),
            size:[size.x,size.z]
        })).add(surfaces[3]);

        //back
        node.add(new Modifier({
            transform:Transform.thenMove(Transform.rotateZ(Math.PI),[0,0,size.z*-0.5]),
            size:[size.x,size.y]
        })).add(surfaces[4]);

        //back
        node.add(new Modifier({
            transform:Transform.translate(0,0,size.z*0.5),
            size:[size.x,size.y]
        })).add(surfaces[5]);

    }


    module.exports=RectangularPrism;

});