define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Modifier   = require("famous/core/Modifier");
	var PositioningFlexibleLayout = require('./../PositioningLayouts/PositioningFlexibleLayout');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var ObjectFactory = require('./../ObjectFactory');

	/**
	PTE: 2 words, 16 bits
	|ACCESSED|DIRTY|VALID|00000|PFN|
	*/
	function PageTableEntry(options,pageFrameNumber) 
	{
	    View.apply(this, arguments);

	    this.position = [0,0];// options.position;
	    this.size = [undefined,undefined];

	    this.pageFrameNumber = pageFrameNumber;
	    this.addressMask = 0x03;
	    this.pageOffsetBits = 2;

	    _initView.call(this);

 		this.calculateSize = function() {
	    	return this.owner.calculateChildSize(this);
	    };	    
	    this.calculatePosition = function(){
	    	return this.owner.calculateChildPosition(this);
	    };
	    this.calculateChildPosition = function(){
	    	return this.calculatePosition();
	    };
	    this.calculateChildSize = function(){
	    	return this.calculateSize();
	    };
	}

	PageTableEntry.prototype = Object.create(View.prototype);
	PageTableEntry.prototype.constructor = PageTableEntry;

	PageTableEntry.prototype.getModifier = function getModifier()
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

    PageTableEntry.prototype.setAccessed = function setAccessed(accessed,callstack){
    	this.accessed = accessed;
    	this.accessedFlagView.setValue(this.accessed);
    	callstack.push(this.accessedFlagView.calculatePosition());
    };

    PageTableEntry.prototype.setDirty = function setDirty(dirty){
    	this.dirty = dirty;
    	this.dirtyFlagView.setValue(this.dirty);
    };

    PageTableEntry.prototype.setValid = function setValid(valid,callstack){
    	this.valid = valid;
    	this.validFlagView.setValue(this.valid);    	
    };

    PageTableEntry.prototype.isValid = function isValid(callstack){
    	this.validFlagView.access(callstack);    
    	return this.validFlagView.value;
    };

    PageTableEntry.prototype.setPageFrameNumber = function setPageFrameNumber(number, callstack)
    {
    	this.pageFrameNumber = number;
    	this.pageFrameNumberView.setValue(this.pageFrameNumber);
    };

    PageTableEntry.prototype.getPageFrameNumber = function getPageFrameNumber(callstack)
    {
    	this.pageFrameNumberView.access(callstack);
    	return this.pageFrameNumberView.getValue();
    };

    PageTableEntry.prototype.access = function access(data)
    {
    	if (this.isValid(data.callstack))
    	{
    		this.setAccessed(true,data.callstack);

    		var pageOffset = data.address & this.addressMask;
    		data.address = (this.pageFrameNumber << this.pageOffsetBits) + pageOffset;

    		data.callstack.push(this.calculatePosition());
    		
    		// console.log(data.address);

    		this._eventOutput.emit('mem_access',data);
    	}
    	else
    	{
    		this._eventOutput.emit('page_fault',{
				virtualAddress:data.address, 
				pageTableEntry:this,
				reason:"pte_invalid"
			});
    	}
    };


	function _makeLayout()
	{
		var ratios = [1,1,1,5,8];
		var layout = new PositioningFlexibleLayout({
		    ratios: ratios
		});

		var views = [];
		layout.sequenceFrom(views);

		factory = new ObjectFactory();

		this.accessedFlagView = factory.createFlagView(0);
		this.dirtyFlagView = factory.createFlagView(0);
		this.validFlagView = factory.createFlagView(0);
		this.otherFlagsView = factory.createNumberView(5,0);
		this.pageFrameNumberView = factory.createNumberView(8,this.pageFrameNumber);

		views.push(this.accessedFlagView);
		views.push(this.dirtyFlagView);
		views.push(this.validFlagView);
		views.push(this.otherFlagsView);
		views.push(this.pageFrameNumberView);

		for (var i=0;i<views.length;i++)
		{
			views[i].owner = layout;
			// console.log(i);
		}
		
		layout.views = views;

		return layout;
	}

	function _initView()
	{		
		this.layout = _makeLayout.call(this);	
		this.add(this.layout);
		this.layout.owner = this;
/*
		this._eventInput.on('mem_access', function(data) {

			var pageNumber = data.address >> this.pageOffsetBits;
			var pageOffset = data.address & this.addressMask;

			var viewIndex = pageNumber-this.minPageNumber;
  			this.grid.views[viewIndex].access();

  			var newAddress = this.pageMap[pageNumber] << this.pageOffsetBits;
  			newAddress += pageOffset;
  			this._eventOutput.emit('mem_access',{address:newAddress});
  			  			
		}).bindThis(this);	
		*/	
	}

	module.exports = PageTableEntry;
});






































