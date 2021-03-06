package jeeves.config.springutil;

import org.fao.geonet.utils.Log;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.Lifecycle;
import org.springframework.web.context.ConfigurableWebApplicationContext;
import org.springframework.web.context.ContextLoaderListener;
import org.springframework.web.context.support.WebApplicationContextUtils;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;

public class JeevesContextLoaderListener extends ContextLoaderListener {

    private static final String POST_PROCESSOR_INIT_PARAM = "applicationContextPostProcessors";

    @Override
    protected void customizeContext(ServletContext servletContext, ConfigurableWebApplicationContext applicationContext) {
        processBeanFactoryPostProcessorParam(applicationContext, servletContext.getInitParameter(POST_PROCESSOR_INIT_PARAM));
        String baseURL = servletContext.getContextPath();
        String webappName;
        if (baseURL.length() > 1) {
            webappName = baseURL.substring(1) + ".";
        } else {
            webappName = "";
        }
        String key = webappName + POST_PROCESSOR_INIT_PARAM;
        String param = System.getProperty(key);
        if (param != null) {
            processBeanFactoryPostProcessorParam(applicationContext, param);
        } else {
            key = "geonetwork." + POST_PROCESSOR_INIT_PARAM;
            param = System.getProperty(key);
            processBeanFactoryPostProcessorParam(applicationContext, param);
        }
    }

    private void processBeanFactoryPostProcessorParam(ConfigurableWebApplicationContext applicationContext, String param) {
        if (param != null) {
            for (String className : param.split(",")) {
                if (!className.trim().isEmpty()) {
                    try {
                        Class<?> class1 = Class.forName(className.trim());
                        BeanFactoryPostProcessor postProcessor = (BeanFactoryPostProcessor) class1.newInstance();
                        applicationContext.addBeanFactoryPostProcessor(postProcessor);
                    } catch (Throwable e) {
                        Log.error(Log.JEEVES, "Unable to create Bean Post processor: "+className);
                    }
                }
            }
        }
    }

    @Override
    public void contextInitialized(ServletContextEvent event) {
        super.contextInitialized(event);
        Lifecycle context = (Lifecycle) WebApplicationContextUtils.getWebApplicationContext(event.getServletContext());
        context.start();
    }

    @Override
    public void contextDestroyed(ServletContextEvent event) {
        Lifecycle context = (Lifecycle) WebApplicationContextUtils.getWebApplicationContext(event.getServletContext());
        if (context != null) {
            context.stop();
        }
        super.contextDestroyed(event);
    }
}
