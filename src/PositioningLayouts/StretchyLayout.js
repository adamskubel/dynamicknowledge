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

        //if (this.size)
        //    this.idealSize = [this.size[0],this.size[1]];
        //else
            this.idealSize = [0,0];


        this.children = [];
        //this.layoutConfigs = [];
        //this.modifiers = [];
	}

	StretchyLayout.prototype = Object.create(PositionableView.prototype);

    StretchyLayout.prototype.constructor = StretchyLayout;

    StretchyLayout.DEFAULT_OPTIONS = {
        viewSpacing: [0,0]
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

    function _layoutViews()
    {
        var currentPosition = new Vector(0,0,0);
        currentPosition.y += this.options.viewSpacing[1];
        for (var i=0;i<this.children.length;i++)
        {
            var view = this.children[i];
			console.log(currentPosition.toString());
            _setModifier(view,currentPosition.toArray());
            view.layout(view._dynamicSize.toArray(2));
            currentPosition.y += view._dynamicSize.y + this.options.viewSpacing[1];

        }
		this._layoutDirty=false;
    }



	function _reflow(size)
	{
		var weightClasses = {};
		var allWeights = [];

		var containerSize = new Vector(0,0,0);
		for (var i = 0; i < this.children.length; i++)
		{
            var view = this.children[i];

			var weight = view._stretchConfig.weight;
                //this.layoutConfigs[i].weight;
			if (!weightClasses[weight])
				weightClasses[weight] = [];

			weightClasses[weight].push(view);

			allWeights[weight] = 0;

            view._dynamicMeasure = view.measure();
			if (weight > 1)
				view._dynamicSize = Vector.fromArray(view._dynamicMeasure.maximumSize);//Vector.fromArray(_getViewTargetSize(view));
			else if (weight <= 1)
                view._dynamicSize = Vector.fromArray(view._dynamicMeasure.minimumSize);//Vector.fromArray(_getViewMinSize(view));

			containerSize = containerSize.add(view._dynamicSize);
		}

		containerSize.y += this.options.viewSpacing[1]*(this.children.length+1);
		if (size)
		{
			containerSize.x = Math.max(size[0],containerSize.x);
			containerSize.y = Math.max(size[1],containerSize.y);
		}

		var remainingSize = containerSize.clone();
		remainingSize.y -= this.options.viewSpacing[1]*(this.children.length+1);

        var sorted = [];
        for (var x in allWeights)
            sorted.push(x);

		sorted = sorted.sort(function (a, b)
		{
			return a < b;
		});

		var classSpace = {};
		for (w = sorted.length-1; w >= 0; w--)
		{
			weight = sorted[w];
			var weightViews = weightClasses[weight];

			if ((w+1) == sorted.length)
				classSpace[weight] = 0;
			else
				classSpace[weight] = classSpace[sorted[w+1]];

			for (i =0; i<weightViews.length;i++)
			{
				classSpace[weight] += weightViews[i]._dynamicSize.y;
			}
		}




		for (var w = 0; w < sorted.length; w++) {
            weight = sorted[w];
            var inferiorSpace = new Vector(0,0,0);
            if (w < (sorted.length - 1))
            {
                inferiorSpace.y = classSpace[sorted[w+1]];
            }
			weightViews = weightClasses[weight];

            var classSize;
			if (classSpace[weight] < remainingSize.y)
			{
				var maxSize = new Vector(0,0,0);
                for (i=0;i<weightViews.length;i++)
                {
                    maxSize = maxSize.add(Vector.fromArray(view._dynamicMeasure.maximumSize));
                }
                var spaceLeft = remainingSize.sub(inferiorSpace);
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

			remainingSize = remainingSize.sub(classSize);
		}

		return containerSize.toArray(2);
	}

    module.exports = StretchyLayout;
});