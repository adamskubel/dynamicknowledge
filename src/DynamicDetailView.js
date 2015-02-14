define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var View   = require("famous/core/View");
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
    var RenderController = require("famous/views/RenderController");

	var PositionableView = require('./PositioningLayouts/PositionableView');
    var BoxView = require('./PositioningLayouts/BoxView');
	var ObjectFactory = require('./ObjectFactory');
	
	function DynamicDetailView(options) 
	{
		PositionableView.call(this, options);

        this.complexViews = {};

        this.currentView = null;
        this.boxLabel = this.options.boxLabel;

		this.background = (new ObjectFactory()).makeSurface('','outline');
		this.background.modifier = new Modifier({transform: Transform.translate(0,0,-1.5)});

		this.reduceButton = new BoxView({
            text: '-',
            clickable: true,
            size: [20,20],
            viewAlign:[0,0],
            viewOrigin:[0,1],
            position:[0,0,2]
        });

		this.reduceButton.on('click',function(){
            var newLevel = Math.max(0,this.levelOfDetail-1);
			this.setLevelOfDetail(newLevel);
		}.bind(this));

        this.plusButton = new BoxView({
            text: '+',
            clickable: true,
            size: [20,20],
            viewAlign:[0,0],
            viewOrigin:[0,1],
            position:[20,0,2]
        });

        this.plusButton.on('click',function(){
            var newLevel = Math.min(this.options.maxDetail,this.levelOfDetail+1);
            this.setLevelOfDetail(newLevel);
        }.bind(this));

		_addView.call(this,this.reduceButton);
        _addView.call(this,this.plusButton);
        _addView.call(this,this.background);

		if (options)
			this.setLevelOfDetail(options.levelOfDetail ? options.levelOfDetail : 0);
		else
			this.setLevelOfDetail(0);

	}

    DynamicDetailView.DEFAULT_OPTIONS = {
        boxLabel: "",
        boxSize:[10,10],
        maxDetail: 1
    }

	DynamicDetailView.prototype = Object.create(PositionableView.prototype);
	DynamicDetailView.prototype.constructor = DynamicDetailView;


	function _prepareView(view)
	{
		view.renderController = new RenderController({
			inTransition:true,
			outTransition:true
		});

        view.renderController.inTransformFrom(function(state) { return Transform.scale(state,1,1);});
        //view.renderController.outTransformFrom(function(state) { return Transform.scale(1-state,1,1);});

        var dynamicView = this;
		view.show = function(){
			this.renderController.show(this, {duration:200, curve: Easing.outQuad});
		};

		view.hide = function(){
			this.renderController.hide({duration:200, curve: Easing.outQuad});
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

            if (this._stretchConfig)
            {
                this._stretchConfig.weight = 1;
            }
            else
            {
                this.setSize(this.simpleView.getSize());
            }

            this.plusButton.hide();
			this.background.hide();
			this.reduceButton.hide();

            _setActiveView.call(this,this.simpleView);

		}
		else if (levelOfDetail > 0)
		{
            var complexView = _getComplexView.call(this,levelOfDetail);

			if (this._stretchConfig)
			{
                this._stretchConfig.weight = 2;
			}

            this.plusButton.show();
			this.reduceButton.show();

            _setActiveView.call(this,complexView);
		}
		else
		{
			console.error("Unknown detail level :" + levelOfDetail);
		}

		this.requestLayout();
    };


    function _setActiveView(view)
    {
        if (this.currentView)
            this.currentView.hide();

        this.currentView = view;
        this.currentView.show();
    }

    function _getComplexView(levelOfDetail)
    {
        var complexView = this.complexViews[levelOfDetail];

        if (!complexView){
            complexView = this.makeComplexView(levelOfDetail);
            this.complexViews[levelOfDetail] = complexView;
            _addView.call(this,complexView);
        }

        return complexView;
    }


	DynamicDetailView.prototype.makeComplexView = function(){
		return null;
	};

	DynamicDetailView.prototype.makeSimpleView = function()
	{
        var boxView = new BoxView({
            size: this.options.boxSize,
            text: this.options.boxLabel,
            textAlign: [0.5,0.5],
            clickable: true
        });

		boxView.on('click',function(){
			if (this.levelOfDetail == 0)
				this.setLevelOfDetail(1);
			else
				this.setLevelOfDetail(0);

		}.bind(this));


		return boxView;
	};




	module.exports = DynamicDetailView;
});






































