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
		PositionableView.call(this, options);

        this.currentView = null;

		this.background = (new ObjectFactory()).makeSurface('','outline');
		this.background.modifier = new Modifier({transform: Transform.translate(0,0,-1.5)});

		this.closeButton = (new ObjectFactory()).makeButtonView('^','slim');
		this.closeButton.setSize([20,20]);

		this.closeButton.modifier.alignFrom([1,0]);
		this.closeButton.modifier.originFrom(function(){return [1,0];});
		this.closeButton.modifier.transformFrom(Transform.translate(0,0,2));

		this.closeButton.on('click',function(){
			this.setLevelOfDetail(0);
		}.bind(this));


		_addView.call(this,this.closeButton);
        _addView.call(this,this.background);

		if (options)
			this.setLevelOfDetail(options.levelOfDetail ? options.levelOfDetail : 0);
		else
			this.setLevelOfDetail(0);

	}

	DynamicDetailView.prototype = Object.create(PositionableView.prototype);
	DynamicDetailView.prototype.constructor = DynamicDetailView;


	function _prepareView(view)
	{
		view.renderController = new RenderController({
			inTransition:false,
			outTransition:false
		});

        var dynamicView = this;
		view.show = function(){
			this.renderController.show(this);
		};

		view.hide = function(){
			this.renderController.hide();
		};

	}

    function _addView(view)
    {
        _prepareView.call(this,view);

        var node = this;
        if (view.modifier)
            node = this.add(view.modifier);
        else if (view.getModifier)
            node = this.add(view.getModifier());

		view.owner = this;
        node.add(new Modifier({transform: Transform.translate(0,0,1)})).add(view.renderController);
    }

    DynamicDetailView.prototype.measure = function(requestedSize){
        return this.currentView.measure(requestedSize);
    };

    DynamicDetailView.prototype.layout = function(layoutSize){
        if (this.currentView)
			this.currentView.layout(layoutSize);

		this._layoutDirty = false;
		PositionableView.prototype.layout.call(this,layoutSize);
    };

    DynamicDetailView.prototype.needsLayout = function(){
        return this._layoutDirty || ((this.currentView) ? this.currentView.needsLayout() : false);
    };

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

            if (this._stretchConfig)
            {
                this._stretchConfig.weight = 1;
            }
            else
            {
                this.setSize(this.simpleView.getSize());
            }

			this.simpleView.show();
			this.currentView = this.simpleView;
			this.background.hide();
			this.closeButton.hide();
		}
		else if (levelOfDetail == 1)
		{
			if (!this.complexView){
				this.complexView = this.makeComplexView();
				_addView.call(this,this.complexView);
			}

			this.complexView.show();
			this.currentView = this.complexView;
			if (this._stretchConfig)
			{
                this._stretchConfig.weight = 2;
			}

			if (this.simpleView)
				this.simpleView.hide();

			this.background.show();
			this.closeButton.show();
		}
		else
		{
			console.error("Unknown detail level :" + levelOfDetail);
		}

		this.requestLayout();
    };

	DynamicDetailView.prototype.makeComplexView = function(){
		return null;
	};

	DynamicDetailView.prototype.makeSimpleView = function()
	{
		var box = (new ObjectFactory()).makeSurface("MEOW",'compact');
		box.setProperties({cursor:'pointer'});
		box.on('click',function(){
			if (this.levelOfDetail == 0)
				this.setLevelOfDetail(1);
			else
				this.setLevelOfDetail(0);

		}.bind(this));

		box.setSize([120,40]);

        box.measure = function(){
            return {
                minimumSize: box.getSize(),
                maximumSize: box.getSize()
            }
        }

        box.layout = function(layoutSize){
            box.setSize(layoutSize);
        }


		box.needsLayout = function() {return false};

		return box;
	};




	module.exports = DynamicDetailView;
});






































