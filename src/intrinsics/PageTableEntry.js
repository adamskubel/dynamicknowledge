define(function(require,exports,module){

    var PositionableView = require('PositioningLayouts/PositionableView');
    var PViewSwitcher = require('PositioningLayouts/PositionableViewSwitcher');
    var BoxView = require('PositioningLayouts/BoxView');
    var Utils = require('Utils');
    var PSequenceView = require('PositioningLayouts/PSequenceView');
    var ToggleButton = require('Views/ToggleButton');

    function PageTableEntry(options)
    {
        PViewSwitcher.call(this,options);

        _buildViews.call(this);
        this.setActiveView("AddressOnly");
    }

    PageTableEntry.prototype = Object.create(PViewSwitcher.prototype);
    PageTableEntry.prototype.constructor = PageTableEntry;

    PageTableEntry.DEFAULT_OPTIONS = {
        pfn: 0,
        position:[0,0,0]
    };

    PageTableEntry.prototype.registerDynamicObjects = function(controller)
    {
        //controller.addDynamicObject(this.simpleView);
        //controller.addDynamicObject(this.detailedView);

        controller.addDynamicObject({view:this, options:{disabledModes:{"connectingLines":true}}});

        var options = { respectViewState:true, editingDisabled:true, allowedModes:{"connectingLines":true}};

        controller.addDynamicObject({view:this.detailedView.pte_addressView,options:options});
        controller.addDynamicObject({view:this.detailedView.pte_validFlag,options:options});
        controller.addDynamicObject({view:this.detailedView.pte_writeFlag,options:options});
        controller.addDynamicObject({view:this.detailedView.pte_readFlag,options:options});
    };

    function _makeAddressView(physicalPageFrameNumber)
    {
        return new BoxView({
            text: Utils.hexString(physicalPageFrameNumber,5),
            textAlign:[0,0.5],
            size:[true,40]
        });
    }

    function _makeDetailedView(pteConfig)
    {
        var layout = new PSequenceView({
            direction: 0,
            size:[true,60]
        });

        var address = new BoxView({
            text: Utils.hexString(pteConfig.pfn,5),
            textAlign:[0,0.5],
            size:[80,undefined]
        });

        var validFlag = new ToggleButton({
            size:[30,undefined]
        });

        var writeFlag = new ToggleButton({
            size:[30,undefined]
        });

        var readFlag = new ToggleButton({
            size:[30,undefined]
        });

        layout.addChild(address);
        layout.addChild(validFlag);
        layout.addChild(writeFlag);
        layout.addChild(readFlag);

        layout.pte_addressView = address;
        layout.pte_validFlag = validFlag;
        layout.pte_writeFlag = writeFlag;
        layout.pte_readFlag = readFlag;

        layout.hide();

        return layout;
    }

    function _buildViews()
    {
        this.simpleView = _makeAddressView(this.options.pfn);
        this.addView("AddressOnly",this.simpleView);

        this.detailedView = _makeDetailedView({pfn:this.options.pfn});
        this.addView("View2",this.detailedView);
    }

    PageTableEntry.prototype.access = function()
    {
        this.activeView.pulse(50,500);
    };

    PageTableEntry.prototype.getUniqueSuffix = function()
    {
        return Utils.hexString(this.options.pfn,5);
    };

    module.exports = PageTableEntry;

});
