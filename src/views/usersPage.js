var React = require('react');
import User from './user.js';
import {getUsersTitle, nextUsersUrl, backUsersUrl} from '../siteUtil.js';
import {BackButton, NextButton} from './navigation.js';
import {usersPerPage} from '../config.js';

var UsersPage = React.createClass({
  render: function() {
    return <div className='sectionContainer'>
      <h1>{getUsersTitle(this.props.lang, this.props.page)}</h1>
      {
        this.props.users.map(user => <User key={user.id}
          siteSlug={this.props.siteSlug}
          id={user.id}
          displayName={user.displayName}
          lang={this.props.lang} />)
      }
      { this.props.page > 1 ?
        <BackButton href={backUsersUrl(this.props.siteSlug, this.props.lang, this.props.page)}/> : null }
      { this.props.users.length >= usersPerPage ?
        <NextButton href={nextUsersUrl(this.props.siteSlug, this.props.lang, this.props.page)}/> : null }

    </div>;
  }
});

export default UsersPage;

