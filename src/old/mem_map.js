define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Modifier   = require("famous/core/Modifier");
	var PositioningGridLayout = require('PositioningLayouts/PositioningGridLayout');
	var PositioningFlexibleLayout = require('PositioningLayouts/PositioningFlexibleLayout');

	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var MemoryBlockView = require('./../MemoryBlockView');
	var ObjectFactory = require('./../ObjectFactory');
	var mem_map_t = require('./mem_map_t');

	function mem_map(options) 
	{
	    View.apply(this, arguments);

	    this.position = options.position;
	    this.size = options.size;

	    this.pageSize = 4;
	    this.pageOffsetBits = 2;
	    this.addressMask = 0x3;

	    this.startAddress = options.startAddress;
	    this.minPageNumber = 0; // options.startAddress >> this.pageOffsetBits;
	    this.pageCount = options.memSize / this.pageSize;



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

	    this.items = [];
	    this.cells = [];
	    _initView.call(this);

	}

	mem_map.prototype = Object.create(View.prototype);
	mem_map.prototype.constructor = mem_map;

	mem_map.prototype.getModifier = function getModifier()
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

	mem_map.prototype.at = function(index){

		return this.items[index];

	};

    function _makePageView(pageNum) 
    {
    	var page = new PositioningFlexibleLayout({ratios: [2,8], direction:0});

    	var page_def = new mem_map_t({position:[0,0], size:[undefined,undefined]});
    	page_def.setPageFrameNumber(pageNum);

    	var pageCells = new MemoryBlockView({
    		position:[0,0],
    		size:[undefined,undefined],
    		startAddress:(pageNum*this.pageSize)+this.startAddress,
    		memSize:this.pageSize
    	});

    	this.items[pageNum] = page_def;

    	page.setChildren([page_def,pageCells]);

    	for (var i=0;i<pageCells.cells.length;i++)
    		this.cells.push(pageCells.cells[i]);

    	return page;
    }

	
	function _makeGridLayout()
	{
		var grid = new PositioningGridLayout({dimensions: [1,this.pageCount]});
		
		var children = [];
		for (var i=0;i<this.pageCount;i++)
		{
			var myView = _makePageView.call(this,i+this.minPageNumber);			
			children.push(myView);			
		}
		grid.setChildren(children);

		return grid;
	}

	mem_map.prototype.access = function access(data) {
    	
		var pageNumber = data.address >> this.pageOffsetBits;
		var pageOffset = data.address & this.addressMask;

		var viewIndex = pageNumber-this.minPageNumber;
		var newage = this.items[pageNumber].getAge()+3;
		if (newage > 20) newage = 20;
		
		this.items[pageNumber].setAge(newage);
		this.cells[data.address].access(data.address,data);
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

	module.exports = mem_map;
});






































