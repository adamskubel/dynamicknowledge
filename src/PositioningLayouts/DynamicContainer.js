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

        this.children = [];

        this.minimumContainerSize = this.options.minimumContainerSize;
        this.size = this.minimumSize;
        this.offsetVector = new Vector(0,0,0);

        this.offsetState = new Transitionable(Transform.translate(0,0,0));
        this.offsetNode = this.add(new Modifier({transform: function(){return this.offsetState.get();}.bind(this)}));
	}

	DynamicContainer.prototype = Object.create(PositionableView.prototype);
	DynamicContainer.prototype.constructor = DynamicContainer;


	DynamicContainer.DEFAULT_OPTIONS = 
	{
        minimumContainerSize: [0,0],
        isAnimated: false,
        position: [0,0,0],
        edgePadding: [0,0]
    };

	DynamicContainer.prototype.addChild = function(child){

        if (!child)
        {
            console.error("Cannot add null child");
            return;
        }

        if (child instanceof PositionableView)
        {
            child.parent = this;
            this.children.push(child);
            this.offsetNode.add(child.getModifier()).add(child.getRenderController());
            this._layoutDirty = true;
        }
        else
        {
            console.error("Child must be PositionableView. Child = " + child);
        }
	};

    DynamicContainer.prototype.removeChild = function(view)
    {
        var r = this.children.indexOf(view);
        if (r >= 0)
        {
            this.children.splice(r, 1);
            view.hide();
        }
    };

    function _measureChildExtents(child)
    {
        var size = Vector.fromArray(child.measure().minimumSize);
        var topLeft = new Vector(0,0,0);

        if (child.position)
            topLeft = Vector.fromArray(child.position);

        var bottomRight = size.add(topLeft);

        child._dynamicSize = size;

        return {
            bottomRight:bottomRight,
            topLeft:topLeft
        }
    }

    DynamicContainer.prototype.calculateChildPosition = function(child, relativeTo){

        var basePosition = Vector.fromArray(PositionableView.prototype.calculateChildPosition.call(this,child,relativeTo));
        return basePosition.add(this.offsetVector).toArray();
    };

    DynamicContainer.prototype.measure = function(requestedSize){

        var containerSize = Vector.fromArray(this.minimumContainerSize);
        var children = this.children;

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

        var edgePadding = this.options.edgePadding;
        var sizeVector = (bottomRight.sub(topLeft)).add(new Vector(edgePadding[0],edgePadding[1],0));

        topLeft = topLeft.multiply(-1);
        this.offsetVector = topLeft.clone();
        this.offsetState.set(Transform.translate(topLeft.x,topLeft.y,topLeft.z));

        containerSize.x = Math.max(sizeVector.x,containerSize.x);
        containerSize.y = Math.max(sizeVector.y,containerSize.y);

        for (var i=0;i<children.length;i++)
        {
            var child = children[i];
            if (child._dynamicSize.x == 0)
                child._dynamicSize.x = containerSize.x;

            if (child._dynamicSize.y == 0)
                child._dynamicSize.y = containerSize.y;
        }

		return {
			minimumSize: containerSize.toArray(2),
			maximumSize: containerSize.toArray(2)
		};
	};

    DynamicContainer.prototype.layout = function(layoutSize){

        for (var i=0;i<this.children.length;i++)
        {
            this.children[i].layout(this.children[i]._dynamicSize.toArray(2));
        }

        PositionableView.prototype.layout.call(this,layoutSize);
    };

    DynamicContainer.prototype.needsLayout = function(){

        if (this._layoutDirty) return true;

        for (var i=0;i<this.children.length;i++)
        {
            if (this.children[i].needsLayout())
            {
                return true;
            }
        }
        return false;
    };


    module.exports = DynamicContainer;
});	