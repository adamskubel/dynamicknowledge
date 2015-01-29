define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var Modifier   = require("famous/core/Modifier");
	var View   = require("famous/core/View");
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
    var RenderController = require("famous/views/RenderController");

	var PositionableView = require('./PositioningLayouts/PositionableView');
	var ObjectFactory = require('./ObjectFactory');
	
	function DynamicDetailView(options) 
	{
		PositionableView.apply(this, arguments);

		this.setLevelOfDetail(options.levelOfDetail ? 0 : options.levelOfDetail);
	}

	DynamicDetailView.prototype = Object.create(PositionableView.prototype);
	DynamicDetailView.prototype.constructor = DynamicDetailView;


	function _addView(view)
	{
		view.renderController = new RenderController();

		view.show = function(){
			this.renderController.show(this);
		};

		view.hide = function(){
			this.renderController.hide();
		};

		var node = this;
		if (view.modifier)
			node = this.add(view.modifier);

		node.add(view.renderController);
	}


    DynamicDetailView.prototype.setLevelOfDetail = function(levelOfDetail)
    {
        this.levelOfDetail = levelOfDetail;

        if (levelOfDetail == 0)
		{
			if (!this.simpleView)
			{
				this.simpleView = this.makeSimpleView();
				_addView.call(this,this.simpleView);
			}

			if (this.complexView)
				this.complexView.hide();

			this.simpleView.show();
		}
		else if (levelOfDetail == 1)
		{
			if (!this.complexView){
				this.complexView = this.makeComplexView();
				_addView.call(this,this.complexView);
			}

			this.complexView.show();

			if (this.simpleView)
				this.simpleView.hide();
		}
		else
		{
			console.error("Unknown detail level :" + levelOfDetail);
		}
    };

	DynamicDetailView.prototype.makeComplexView = function(){
		return null;
	};

	DynamicDetailView.prototype.makeSimpleView = function()
	{
		var box = (new ObjectFactory()).makeSurface("",'outline');
		return box;
	};

	module.exports = DynamicDetailView;
});






































