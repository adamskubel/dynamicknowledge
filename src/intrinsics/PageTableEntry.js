define(function(require,exports,module){

    var PositionableView = require('PositioningLayouts/PositionableView');
    var PViewSwitcher = require('PositioningLayouts/PositionableViewSwitcher');
    var BoxView = require('PositioningLayouts/BoxView');
    var Utils = require('Utils');

    function PageTableEntry(options)
    {
        PViewSwitcher.call(this,options);

        _buildViews.call(this);
        this.setActiveView("AddressOnly");
    }

    PageTableEntry.prototype = Object.create(PViewSwitcher.prototype);
    PageTableEntry.prototype.constructor = PageTableEntry;

    PageTableEntry.DEFAULT_OPTIONS = {
        pfn: 0
    }

    function _makeAddressView(physicalPageFrameNumber)
    {
        return new BoxView({
            text: Utils.hexString(physicalPageFrameNumber,5),
            textAlign:[0,0.5],
            size:[true,40]
        });
    }

    function _buildViews()
    {
        this.addView("AddressOnly",_makeAddressView(this.options.pfn));
        this.addView("View2",_makeAddressView(this.options.pfn*2));

    }

    PageTableEntry.prototype.access = function()
    {
        this.activeView.pulse(50,500);
    };

    module.exports = PageTableEntry;

});
