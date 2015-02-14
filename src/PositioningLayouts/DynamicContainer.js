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

        this.offsetState = new Transitionable(Transform.translate(0,0,0));
        this.offsetNode = this.add(new Modifier({transform: function(){return this.offsetState.get();}.bind(this)}));
	}

	DynamicContainer.prototype = Object.create(PositionableView.prototype);
	DynamicContainer.prototype.constructor = DynamicContainer;


	DynamicContainer.DEFAULT_OPTIONS = 
	{
        minimumContainerSize: [0,0],
        isAnimated: true,
        position: [0,0,0]
    };

	DynamicContainer.prototype.addChild = function(child){

        if (child instanceof PositionableView)
        {
            this._children.push(child);
            this.offsetNode.add(child.getModifier()).add(child);
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

        if (child.position)
            topLeft = Vector.fromArray(child.position);

        var bottomRight = size.add(topLeft);

        child._dynamicSize = size.toArray(2);

        return {
            bottomRight:bottomRight,
            topLeft:topLeft
        }
    }

    DynamicContainer.prototype.measure = function(requestedSize){

        var containerSize = Vector.fromArray(this.minimumContainerSize);
        var children = this._children;

        var bottomRight = new Vector(0,0,0);
        var topLeft = new Vector(0,0,0);

        for (var i=0;i<children.length;i++)
        {
            var childExtents = _measureChildExtents(children[i]);

            bottomRight.x = Math.max(childExtents.bottomRight.x,bottomRight.x);
            bottomRight.y = Math.max(childExtents.bottomRight.y,bottomRight.y);

            topLeft.x = Math.min(childExtents.topLeft.x,topLeft.x);
            topLeft.y = Math.min(childExtents.topLeft.y,topLeft.y);
        }

        var sizeVector = bottomRight.sub(topLeft);

        topLeft = topLeft.multiply(-1);
        this.offsetState.set(Transform.translate(topLeft.x,topLeft.y,topLeft.z));//, {duration:500, curve:Easing.outQuad});

        containerSize.x = Math.max(sizeVector.x,containerSize.x);
        containerSize.y = Math.max(sizeVector.y,containerSize.y);

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