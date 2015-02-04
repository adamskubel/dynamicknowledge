define(function(require, exports, module) {

	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
    var RenderController = require("famous/views/RenderController");

	var DynamicDetailView = require('./DynamicDetailView');
	var StretchyLayout = require('./PositioningLayouts/StretchyLayout');
	var PositionableView   = require("./PositioningLayouts/PositionableView");
	var ObjectFactory = require('./ObjectFactory');
	
	function MemoryBlockView(options) 
	{
		this.memConfig = {
			pageCount: 4
		};

		DynamicDetailView.call(this, options);

		this.minAddress = this.options.startAddress;
		this.maxAddress = this.minAddress + this.options.memSize;

		this.responsive = this.options.responsive;
	}

	MemoryBlockView.prototype = Object.create(DynamicDetailView.prototype);
	MemoryBlockView.prototype.constructor = MemoryBlockView;

	MemoryBlockView.prototype.access = function access(offset,data) {

        var incomingPoint,outgoingPoint;
        if (this.levelOfDetail == 0)
        {
            incomingPoint = [this.calculatePosition()[0],this.calculatePosition()[1] + this.calculateSize()[1]*((offset - this.minAddress)/this.memSize)];
            outgoingPoint = [incomingPoint[0]+this.calculateSize()[0],incomingPoint[1]];
        }
        else
        {
            var memBlock = this.cells[offset - this.minAddress];
            if (memBlock)
			{
				memBlock.access();
				incomingPoint = this.cells[offset - this.minAddress].calculatePosition();
				outgoingPoint = [incomingPoint[0] + memBlock.calculateSize()[0], incomingPoint[1]];
			}
        }

        data.sender = this;
        data.callstack.push(incomingPoint);
        data.callstack.push(outgoingPoint);

        this._eventOutput.emit('mem_access', data);
	};

	function _createCellView(i)
	{
		var myView = new PositionableView();
		var hexString = '0x' + (this.minAddress + i).toString(16);
		var surface = (new ObjectFactory()).makeSurface(hexString,'compact');
		myView.setSize([80,22]);
		myView.add(surface);

		myView.surface = surface;

		myView.access = function()
		{
			if(this.opacityState.isActive())
				this.opacityState.halt();

			this.opacityState.set(1,{duration: 50, curve: Easing.outQuad},
				function() {
					this.opacityState.set(0.5,{ duration: 400, curve: Easing.outExpo });
				}
			);
		};

		if (this.responsive)
		{
			var blockView = this;
			surface.on('mouseenter',function(eventData){
				myView.access();
				var fromPos = myView.calculatePosition();
				fromPos[0] += blockView.calculateSize()[0];
				var data = {address:blockView.minAddress+i, callstack:blockView.createCallstack()};

				data.callstack.push(fromPos);
				blockView._eventOutput.emit('mem_access',data);
			});
		} 

		return myView;
	}

	function _makeGridLayout()
	{
		var count = this.maxAddress - this.minAddress;
		var rootLayout = new StretchyLayout({
			direction:1,
			viewSpacing:[0,2]
		});
		var views = [];

		for (var i=0;i<count;i++)
		{
			var myView = _createCellView.call(this,i);
			rootLayout.addChild(myView);
		}
		this.cells = views;

		return rootLayout;
	}

	MemoryBlockView.prototype.makeComplexView = function()
	{
		var complexView = _makeGridLayout.call(this);

		//this._eventInput.on('mem_access', function (data) {
		//	if (!(data.sender instanceof MemoryBlockView))
		//		this.access(data.address, data);
		//}).bindThis(this);

		return complexView;
	};

	MemoryBlockView.prototype.makeSimpleView = function(){


		this.minAddress = this.options.startAddress;
		this.maxAddress = this.minAddress + this.options.memSize;

		var box = DynamicDetailView.prototype.makeSimpleView.call(this);
		//box.setText('0x' + this.minAddress.toString(16) + ' - 0x' + this.maxAddress.toString(16));
		box.surface.setText('[' + this.minAddress/this.memConfig.pageCount+']');
        box.setDynamicSizes({minimumSize:[100,18], maximumSize:[100,50]});
		return box;
	};


	module.exports = MemoryBlockView;
});






































