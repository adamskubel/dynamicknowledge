define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Modifier   = require("famous/core/Modifier");
	var GridLayout = require('famous/views/GridLayout');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var MemoryBlockView = require('./MemoryBlockView');
	var ObjectFactory = require('./ObjectFactory');

	function kswapd(options, memMap,swapFile,dataObjects,pageTable) 
	{
	    View.apply(this, arguments);

	    this.position = options.position;
	    this.size = options.size;

	    this.num_free_pages_low = 1;
	    this.num_free_pages_high = 2;

	    this.memMap = memMap;
	    this.swapFile = swapFile;
	    this.dataObjects = dataObjects;
	    this.pageTable = pageTable;
				
		this.pageSize = 4;
	    this.calculateSize = function() {
	    	return this.size;
	    };	    
	    this.calculatePosition = function(){
	    	return this.position;
	    };

	    _initView.call(this);
	}

	kswapd.prototype = Object.create(View.prototype);
	kswapd.prototype.constructor = kswapd;

	kswapd.DEFAULT_OPTIONS = {
		position: [0,0,0]
	};


	kswapd.prototype.getModifier = function getModifier()
    {
    	var view = this;
    	return new Modifier({
    		size : function () {
    			return view.size;
    		},
		    transform : function(){
		        return Transform.translate(view.position[0], view.position[1], 0);
		    }
		});
    };


	kswapd.prototype.run = function(){

		var mem_map = this.memMap.items;

		//Count free pages and decrement age
		var free = mem_map.length;
		for (var i=0;i<mem_map.length;i++)
		{
			var item = mem_map[i];
			var newage = item.getAge() - 1;
			if (newage < 0) newage = 0;

			item.setAge(newage);

			if (mem_map[i].getCount() > 0)
				free--;
		}
		
		var deallocCount = this.num_free_pages_high - free;

		console.log("Deallocating " + deallocCount + " items");

		for (var n=0;n<deallocCount;n++)
		{
			//Find LRU
			var oldestItem = undefined;
			var oldestAge = 21;
			for (var i=0;i<mem_map.length;i++)
			{
				if (mem_map[i].getCount() <= 0)
					continue;

				var age = mem_map[i].getAge();
				if (age < oldestAge)
				{
					oldestAge = age;
					oldestItem = mem_map[i];
				}		
			}

			var physicalPageNum = oldestItem.getPageFrameNumber();
			var deallocAddress = physicalPageNum << 2;


			for (var i=deallocAddress; i <  deallocAddress+this.pageSize;i++)
			{	
				this.dataObjects[i].setContainer('swap',this.dataObjects[i].containerAddress);
			}

			oldestItem.setCount(0);
			oldestItem.setAge(0);
			this.pageTable.getPageByPFN(physicalPageNum).setValid(false);
		}

	};


	function _initView()
	{		
		var box = (new ObjectFactory()).createAccessView();
		box.setValue("kswapd");

		var me = this;
		box.surface.on('click',function(data){
			box.access();
			me.run();
		});

		this.add(box);	
	}


	module.exports = kswapd;
});