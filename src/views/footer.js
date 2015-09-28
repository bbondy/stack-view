var React = require('react');
import {sites} from '../config.js';
import {siteUrl} from '../siteUtil.js';
import cx from '../classSet.js';

var FooterLink = React.createClass({
  render: function () {
    return <span>
      <a className={cx({
          current: this.props.current,
        })}
        href={siteUrl(this.props.siteSlug, this.props.lang)}>
          {this.props.name}
      </a>
    </span>;
  }
});

var Footer = React.createClass({
  render: function () {
    return <div className='footer'>
    {
      sites.map(site => <FooterLink key={site.slug}
        current={site.slug === this.props.siteSlug}
        name={site.name}
        siteSlug={site.slug}
        lang={this.props.lang} />)
    }
    </div>;
  }
});

export default Footer;
