define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View   = require("famous/core/View");
	var ViewSequence = require('famous/core/ViewSequence');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var RenderController = require("famous/views/RenderController");

	var PositionableView = require('./PositionableView');
	var ObjectFactory = require('../ObjectFactory');
	var Vector = require('../ProperVector');

	function StretchyLayout(options)
	{
        PositionableView.call(this,options);

        this.size = this.options.size;
        this.position = this.options.position;
		this.idealSize = [0,0];
        this.children = [];
	}

	StretchyLayout.prototype = Object.create(PositionableView.prototype);

    StretchyLayout.prototype.constructor = StretchyLayout;

    StretchyLayout.DEFAULT_OPTIONS = {
        viewSpacing: [0,0],
		direction: 0
    };

    StretchyLayout.prototype.addChild = function(view,config)
    {
        view.parent = this;
        this.children.push(view);

        if (!config)
            config = {
                weight: 0
            };

        view._stretchConfig = config;

        this.add(view.getModifier()).add(view);

		//this.layout();
    };


    function _setModifier(view, position)
    {
        view.setPosition(position);
    }

    StretchyLayout.prototype.measure = function(requestedSize)
	{
		var size = (requestedSize) ? requestedSize : this.idealSize;
		var resultSize = _reflow.call(this,size);
		return {
			minimumSize: resultSize,
			maximumSize: resultSize
		}
	};

    StretchyLayout.prototype.layout = function(layoutSize)
    {
        _layoutViews.call(this);
        this.setSize(layoutSize);
    };

    StretchyLayout.prototype.needsLayout = function()
    {
        if (this._layoutDirty)
            return true;

        for (var i=0;i<this.children.length;i++)
        {
            if (this.children[i].needsLayout())
                return true;
        }

        return false;
    };

	function _getDirectionVector(){
		if (this.options.direction == 0)
		{
			return new Vector(1,0,0);
		}
		else if (this.options.direction  == 1)
		{
			return new Vector(0,1,0);
		}
		else
		{
			console.error("Unexpected direction: " + this.direction);
		}
	}

	function _getWidthVector(){
		if (this.options.direction  == 0)
		{
			return new Vector(0,1,0);
		}
		else if (this.options.direction  == 1)
		{
			return new Vector(1,0,0);
		}
		else
		{
			console.error("Unexpected direction: " + this.direction);
		}
	}

    function _layoutViews()
    {
		var dir = _getDirectionVector.call(this);
		var viewSpacing = Vector.fromArray(this.options.viewSpacing);

        var currentPosition = new Vector(0,0,0);
		currentPosition = currentPosition.add(viewSpacing);

        for (var i=0;i<this.children.length;i++)
        {
            var view = this.children[i];
			console.log(currentPosition.toString());
            _setModifier(view,currentPosition.toArray());
            view.layout(view._dynamicSize.toArray(2));
			currentPosition = currentPosition.add((view._dynamicSize.add(viewSpacing)).multiply(dir));

        }
		this._layoutDirty=false;
    }



	function _reflow(size)
	{
		var dir = _getDirectionVector.call(this);
		var cross =  _getWidthVector.call(this);
		var viewSpacing = Vector.fromArray(this.options.viewSpacing);
		var children = this.children;

		var weightClasses = {};
		var weightSet = [];

		console.log('Cross = ' + cross.toString());
		var length = viewSpacing.dot(dir);
		var width = viewSpacing.dot(cross);
		for (var i = 0; i <children.length; i++)
		{
            var view =children[i];

			var weight = view._stretchConfig.weight;
			if (!weightClasses[weight])
				weightClasses[weight] = [];

			weightClasses[weight].push(view);

			weightSet[weight] = 0;

            view._dynamicMeasure = view.measure();
			if (weight > 1)
				view._dynamicSize = Vector.fromArray(view._dynamicMeasure.maximumSize);
			else if (weight <= 1)
                view._dynamicSize = Vector.fromArray(view._dynamicMeasure.minimumSize);


			length += view._dynamicSize.dot(dir);
			length += viewSpacing.dot(dir);

			width = Math.max(view._dynamicSize.dot(cross),width);
		}

		width += viewSpacing.dot(cross)*2;

		var containerSize = new Vector(0,0,0);
		containerSize = containerSize.add(cross.multiply(width));
		containerSize = containerSize.add(dir.multiply(length));

		if (size)
		{
			containerSize.x = Math.max(size[0],containerSize.x);
			containerSize.y = Math.max(size[1],containerSize.y);
		}

		var remainingSize = containerSize.dot(dir) - viewSpacing.dot(dir)*(this.children.length+1);


        var uniqueSortedWeights = [];
        for (var aw in weightSet)
            uniqueSortedWeights.push(aw);

		uniqueSortedWeights = uniqueSortedWeights.sort(function (a, b)
		{
			return a < b;
		});

		var classSpace = {};
		for (w = uniqueSortedWeights.length-1; w >= 0; w--)
		{
			weight = uniqueSortedWeights[w];
			var weightViews = weightClasses[weight];

			if ((w+1) == uniqueSortedWeights.length)
				classSpace[weight] = 0;
			else
				classSpace[weight] = classSpace[uniqueSortedWeights[w+1]];

			for (i =0; i<weightViews.length;i++)
			{
				classSpace[weight] += weightViews[i]._dynamicSize.dot(dir);
			}
		}

		for (var w = 0; w < uniqueSortedWeights.length; w++) {
            weight = uniqueSortedWeights[w];
            var inferiorSpace = 0;
            if (w < (uniqueSortedWeights.length - 1))
            {
                inferiorSpace = classSpace[uniqueSortedWeights[w+1]]; //.dot(dir);
            }
			weightViews = weightClasses[weight];

            var classSize;
			if (classSpace[weight] < remainingSize)
			{
				var maxSize = new Vector(0,0,0);
                for (i=0;i<weightViews.length;i++)
                {
                    maxSize = maxSize.add(Vector.fromArray(view._dynamicMeasure.maximumSize));
                }
                var spaceLeft = remainingSize - inferiorSpace;
                classSize = new Vector(0,Math.min(maxSize.y,spaceLeft.y),0);

                for (i=0;i<weightViews.length;i++)
                {
                    var target = Vector.fromArray(weightViews[i]._dynamicMeasure.maximumSize);
                    weightViews[i]._dynamicSize.y = (target.y/maxSize.y)*classSize.y;
                }
			}
            else
            {
                classSize = classSpace[weight] - inferiorSpace;
            }

			remainingSize -= classSize; //= remainingSize.sub(classSize);
		}

		return containerSize.toArray(2);
	}

    module.exports = StretchyLayout;
});