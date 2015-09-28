var React = require('react');
import UserPage from './userPage.js';
import UsersPage from './usersPage.js';
import QuestionPage from './questionPage.js';
import QuestionsPage from './questionsPage.js';
import TagPage from './tagPage.js';
import SitePerLangPage from './sitePerLangPage.js';
import SiteBasePage from './siteBasePage.js';
import IndexPage from './indexPage.js';
import NavigationBar from './navigationBar.js';
import Footer from './footer.js';

var Main = React.createClass({
  render: function () {
    return <html>
      <head>
        <title>{this.props.title}</title>
        <link rel='stylesheet' href='/static/css/main.css'/>
        <link rel='stylesheet' href='/static/css/font-awesome/font-awesome.css'/>
        <script src='/static/js/analytics.js' async='async'/>
     </head>
     <body>
     <div className='mainBody'>
       { this.props.siteSlug && this.props.lang ?
        <NavigationBar siteSlug={this.props.siteSlug} lang={this.props.lang}/> : null }
       { this.props.siteLangPage ? <SitePerLangPage siteSlug={this.props.siteSlug}
         lang={this.props.lang}/> : null }
       { this.props.siteBasePage ? <SiteBasePage siteSlug={this.props.siteSlug}/> : null }
       { this.props.questions ? <QuestionsPage siteSlug={this.props.siteSlug}
         lang={this.props.lang}
         page={Number(this.props.page)}
         questions={this.props.questions} /> : null }
       { this.props.question ? <QuestionPage siteSlug={this.props.siteSlug}
         lang={this.props.lang}
         question={this.props.question}
         answers={this.props.answers}/> : null }
       { this.props.users ? <UsersPage siteSlug={this.props.siteSlug}
         lang={this.props.lang}
         page={Number(this.props.page)}
         users={this.props.users} /> : null }
       { this.props.user ? <UserPage siteSlug={this.props.siteSlug}
         lang={this.props.lang}
         user={this.props.user}/> : null }
       { this.props.tags ? <TagPage siteSlug={this.props.siteSlug}
         lang={this.props.lang}
         tags={this.props.tags}/> : null }
       { !this.props.question && !this.props.user && !this.props.tags && !this.props.questions && !this.props.users && !this.props.siteLangPage && !this.props.siteBasePage ? <IndexPage/> : null }
     </div>
     <Footer siteSlug={this.props.siteSlug} lang={this.props.lang} />
     </body>
   </html>;
  }
});
module.exports = Main;
