define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var PositionableView = require('./PositionableView');
    var Vector = require('../ProperVector');

	function DynamicContainer(options)
	{
		PositionableView.call(this, options);

        this._children = [];

        this.minimumContainerSize = this.options.minimumContainerSize;
        this.size = this.minimumSize;

	}

	DynamicContainer.prototype = Object.create(PositionableView.prototype);
	DynamicContainer.prototype.constructor = DynamicContainer;


	DynamicContainer.DEFAULT_OPTIONS = 
	{
        minimumContainerSize: [0,0],
        isAnimated: true
        //positionTransition: {duration:250, curve: Easing.outQuad},
        //sizeTransition: {duration:250, curve: Easing.outQuad}
    };

	DynamicContainer.prototype.addChild = function(child){

        if (child instanceof PositionableView)
        {
            this._children.push(child);
            this.add(child.getModifier()).add(child);
            this._layoutDirty = true;
        }
        else
            console.error("Child must be PositionableView");
	};

	DynamicContainer.prototype.setAnimated = function(isAnimated) {
		this.isAnimated = isAnimated;
	};

    function _measureChildExtents(child)
    {
        var size = Vector.fromArray(child.measure().minimumSize);
        var topLeft = new Vector(0,0,0);


        var bottomRight = size.clone();

        if (child.position)
            topLeft = Vector.fromArray(child.position);

        child._dynamicSize = size.toArray(2);

        return topLeft.add(bottomRight);
    }

    DynamicContainer.prototype.measure = function(requestedSize){

        var containerSize = Vector.fromArray(this.minimumContainerSize);
        var children = this._children;

        for (var i=0;i<children.length;i++)
        {
            var childExtents = _measureChildExtents(children[i],containerSize);
            containerSize.x = Math.max(childExtents.x,containerSize.x);
            containerSize.y = Math.max(childExtents.y,containerSize.y);
        }

        for (var i=0;i<children.length;i++)
        {
            var child = children[i];
            if (!child._dynamicSize[0])
                child._dynamicSize[0] = containerSize.x;

            if (!child._dynamicSize[1])
                child._dynamicSize[1] = containerSize.y;
        }

		return {
			minimumSize: containerSize.toArray(2),
			maximumSize: containerSize.toArray(2)
		};
	};

    DynamicContainer.prototype.layout = function(layoutSize){

        for (var i=0;i<this._children.length;i++)
        {
            this._children[i].layout(this._children[i]._dynamicSize);
        }

        PositionableView.prototype.layout.call(this,layoutSize);
    };

    DynamicContainer.prototype.needsLayout = function(){

        if (this._layoutDirty) return true;

        for (var i=0;i<this._children.length;i++)
        {
            if (this._children[i].needsLayout())
            {
                return true;
            }
        }
        return false;
    };


    module.exports = DynamicContainer;
});	