define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Modifier   = require("famous/core/Modifier");
	var PositioningGridLayout = require('./PositioningLayouts/PositioningGridLayout');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var MemoryBlockView = require('./MemoryBlockView');
	var ObjectFactory = require('./ObjectFactory');

	function MemoryPagingView(options) 
	{
	    View.apply(this, arguments);

	    this.position = options.position;
	    this.size = options.size;

	    this.pageSize = 4;
	    this.pageOffsetBits = 2;
	    this.addressMask = 0x3;

	    this.minPageNumber = options.startAddress >> this.pageOffsetBits;
	    this.pageCount = options.memSize / this.pageSize;

	    _initView.call(this);

	    this.calculateSize = function() {
	    	return this.size;
	    };	    
	    this.calculatePosition = function(){
	    	return this.position;
	    };
	    this.calculateChildPosition = function(){
	    	return this.calculatePosition();
	    };
	    this.calculateChildSize = function(){
	    	return this.calculateSize();
	    };
	}

	MemoryPagingView.prototype = Object.create(View.prototype);
	MemoryPagingView.prototype.constructor = MemoryPagingView;

	MemoryPagingView.prototype.getModifier = function getModifier()
    {
    	var blockView = this;
    	return new Modifier({
    		size : function () {
    			return blockView.size;
    		},
		    transform : function(){
		        return Transform.translate(blockView.position[0], blockView.position[1], 0);
		    }
		});
    };

	function _makeMemoryBlock(pageNum)
	{
		var memoryBlock = new MemoryBlockView({position:[undefined,undefined],startAddress:0,memSize:this.pageSize});

		memoryBlock.on('mem_access',function(data){
			data.sender = this;
			this._eventOutput.emit('mem_access',data);
		}).bindThis(this);

		return memoryBlock;
	}

	function _createPageView(pageNum)
	{
		var pageView = new View();

		var hexString = (pageNum << this.pageOffsetBits).toString(16);
		var surface = (new ObjectFactory()).makeSurface(hexString);

		var state = new Transitionable(0.5);
		surface.opacityMod  = new Modifier({
			opacity: function(){return  state.get();},
			size: [50,undefined]

		});

		pageView
			.add(surface.opacityMod)
			.add(surface);

		var pageMemory = _makeMemoryBlock.call(this);
		pageMemory.position = [50,0];
		pageMemory.size = [undefined,undefined];
		pageView.add(pageMemory.getModifier()).add(pageMemory);
		pageMemory.owner = pageView;

		pageMemory.calculateSize = function()
		{
			return this.owner.calculateSize();
		};

		pageMemory.calculatePosition = function() {
			var childPosition = this.owner.calculatePosition();
			return [childPosition[0]+50,childPosition[1]];
		}

		pageView.surface = surface;

		pageView.access = function(offset,data)
		{
			if(state.isActive()) 
				state.halt();

			state.set(0.8,{duration: 50, curve: Easing.outQuad},
				function() {
					state.set(0.5,{ duration: 500, curve: Easing.outQuad });
				}
			);

			pageMemory.access(offset,data);
		}
		
		return pageView;
	}

	function _makeGridLayout()
	{
		var grid = new PositioningGridLayout({dimensions: [1,this.pageCount]});
		grid.views = [];
		grid.sequenceFrom(grid.views);

		for (var i=0;i<this.pageCount;i++)
		{
			var myView = _createPageView.call(this,i+this.minPageNumber);

			myView.owner = grid;
			grid.views.push(myView);

			myView.calculateSize = function() {
				return this.owner.calculateChildSize(this);
			};
			myView.calculatePosition = function() {
				return this.owner.calculateChildPosition(this);
			};
		}
		return grid;
	}

	MemoryPagingView.prototype.access = function access(data) {
    	

		var pageNumber = data.address >> this.pageOffsetBits;
		var pageOffset = data.address & this.addressMask;

		var viewIndex = pageNumber-this.minPageNumber;
		this.grid.views[viewIndex].access(pageOffset,data);
    };

	function _initView()
	{		
		var grid = _makeGridLayout.call(this);	
		
		this.grid = grid;
		this.grid.owner = this;
		
		this.add(grid);

		this._eventInput.on('mem_access', function(data) {
				this.access(data);
  			  				
		}).bindThis(this);		
	}

	module.exports = MemoryPagingView;
});






































