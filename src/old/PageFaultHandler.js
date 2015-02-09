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
	var MemoryBlockView = require('./../MemoryBlockView');
	var ObjectFactory = require('./../ObjectFactory');

	function PageFaultHandler(options, dataObjects, memMap) 
	{
	    View.apply(this, arguments);

	    this.position = options.position;
	    this.size = options.size;

	    this.pageSize = 4;
	    this.memSize =16;

	    this.dataObjects = dataObjects;
	    this.memMap = memMap;
				
	    this.calculateSize = function() {
	    	return this.size;
	    };	    
	    this.calculatePosition = function(){
	    	return this.position;
	    };

	    _initView.call(this);
	}

	PageFaultHandler.prototype = Object.create(View.prototype);
	PageFaultHandler.prototype.constructor = PageFaultHandler;

	PageFaultHandler.prototype.getModifier = function getModifier()
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

    function _moveToSwap(address)
    {

    }

    function _isMemFree(address)
    {
    	// for (var i=0;i<this.dataObjects.length;i++)
    	// {
    	// 	var data = this.dataObjects[i];
    	// 	if (data.containerName == 'mem' && data.containerAddress == address)
    	// 	{
    	// 		return false;
    	// 	}	
    	// }

    	var pageNum = address >> 2;
    	var mapItem = this.memMap.items[pageNum];

    	if (mapItem.getCount() > 0)
    		return false;
    	else
    		return true;
    }

    function _getSwapData(swapOffset)
    {
    	for (var i=0;i<this.dataObjects.length;i++)
    	{
    		var data = this.dataObjects[i];
    		if (data.containerName == 'swap' && data.containerAddress == swapOffset)
    		{
    			return data;
    		}	
    	}
    }

    function _loadFromSwap(swapOffset)
    {
    	var freeAddress = 0;
    	for (;freeAddress < this.memSize;freeAddress++)
    	{
    		if (_isMemFree.call(this,freeAddress))
    			break;
    	}

    	if (freeAddress >= this.memSize)
    		return false;
    	
    	var pageNum = freeAddress >> 2;
    	var mapItem = this.memMap.items[pageNum];
    	mapItem.setCount(1,{});


    	for (var i=0;i<4;i++,freeAddress++)
    	{
    		var data = _getSwapData.call(this,i+swapOffset);

    		if (data != undefined)
	    		data.setContainer('mem',freeAddress);
	    	else
	    		return {success: false};
    	}

    	return {success: true, memAddress: freeAddress-4};
    }


	function _initView()
	{		
		var box = (new ObjectFactory()).createFlagView(0);

		this.add(box);

		this._eventInput.on('page_fault', function(data) {

			if (data.reason == "pte_not_found")
			{
				//
			}
			else if (data.reason == "pte_invalid")
			{
				//PFN holds some kind of offset into the swap file
				//For now I'll assume this offset is represented in pages

				var loadResult = _loadFromSwap.call(this,data.pageTableEntry.pageFrameNumber*this.pageSize);

				if (loadResult.success)
				{
					data.pageTableEntry.setPageFrameNumber(loadResult.memAddress/4)
					data.pageTableEntry.setValid(true);
				}
			}

  			  			
		}).bindThis(this);		
	}

	module.exports = PageFaultHandler;
});






































